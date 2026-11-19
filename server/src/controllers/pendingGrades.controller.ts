import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Work } from "../models/Work.js";
import { Grade } from "../models/Grade.js";
import { Rubric } from "../models/Rubric.js";
import { User } from "../models/User.js";
import { Degree } from "../models/Degree.js";
import { RubricRole, WorkStage, NotificationType } from "../types/index.js";
import { notify } from "../services/notification.service.js";
import { formatDay } from "../services/gradingAlerts.service.js";
import { REMINDER_DAYS_BEFORE } from "../config/gradingDeadline.js";
import { DEFAULT_ROLE_WEIGHTS } from "../config/gradingDefaults.js";
import {
  normalizeGradingDays,
  getGradingDeadline,
  getGradingPhase,
  findMissingGraders,
  type GradingPhase,
} from "../utils/gradingDeadline.js";
import {
  calculatePartialFinalGrade,
  validateClosureReason,
  parseExtraDays,
  getClosureBlocker,
} from "../utils/gradeClosure.js";

/** Works that are still waiting for someone's grade. */
const WAITING_STAGES: WorkStage[] = [WorkStage.DEFENSE_READY, WorkStage.DEFENDED];

type WorkDoc = InstanceType<typeof Work>;

interface PendingGradeItem {
  workId: string;
  studentName: string;
  tutorName: string;
  defenseDate?: Date;
  deadline: Date | null;
  phase: GradingPhase;
  extraDays: number;
  receivedCount: number;
  missing: { id: string; name: string; role: "tutor" | "jury" }[];
}

async function getBaseDays(degreeId: unknown): Promise<number> {
  const degree = await Degree.findById(degreeId).select("gradingDays");
  return normalizeGradingDays(degree?.gradingDays);
}

/** Deadline, phase and who is missing for one work. */
async function computeStatus(work: WorkDoc, baseDays: number, now: Date) {
  const days = baseDays + (work.gradingExtraDays ?? 0);
  const deadline = getGradingDeadline(work.defense?.date, days);
  const phase = getGradingPhase(deadline, now, REMINDER_DAYS_BEFORE);

  const grades = await Grade.find({ work: work._id });
  const expected = [work.tutor.toString(), ...(work.defense?.jury ?? []).map((j) => j.toString())];
  const missing = findMissingGraders(
    expected,
    grades.map((g) => g.grader.toString())
  );
  const receivedCount = new Set(expected).size - missing.length;

  return { deadline, phase, grades, missing, receivedCount };
}

type Loaded =
  | { ok: true; work: WorkDoc; student: InstanceType<typeof User>; baseDays: number }
  | { ok: false; status: number; message: string };

/** Loads a work and checks it belongs to the coordinator's degree and is waiting for grades. */
async function loadOwnWork(workId: string, coordinatorId: string): Promise<Loaded> {
  const coordinator = await User.findById(coordinatorId);
  if (!coordinator?.degreeManaged) {
    return { ok: false, status: 400, message: "No tienes una titulación asignada" };
  }

  const work = await Work.findById(workId);
  if (!work) return { ok: false, status: 404, message: "No encontrado" };

  const student = await User.findById(work.student);
  if (!student?.degree || student.degree.toString() !== coordinator.degreeManaged.toString()) {
    return { ok: false, status: 403, message: "Este trabajo no pertenece a tu titulación" };
  }
  if (!WAITING_STAGES.includes(work.stage) || !work.defense?.date) {
    return { ok: false, status: 409, message: "Este trabajo no está esperando calificaciones" };
  }

  const baseDays = await getBaseDays(coordinator.degreeManaged);
  return { ok: true, work, student, baseDays };
}

/** Coordinator: every work of their degree that is waiting for grades, overdue ones first. */
export async function getPendingGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const baseDays = await getBaseDays(coordinator.degreeManaged);
    const now = new Date();

    const works = await Work.find({
      stage: { $in: WAITING_STAGES },
      "defense.date": { $ne: null },
    })
      .populate({ path: "student", match: { degree: coordinator.degreeManaged }, select: "fullName" })
      .sort({ "defense.date": 1 });

    const mine = works.filter((w) => w.student);

    const userIds = new Set<string>();
    for (const w of mine) {
      userIds.add(w.tutor.toString());
      for (const j of w.defense?.jury ?? []) userIds.add(j.toString());
    }
    const users = await User.find({ _id: { $in: [...userIds] } }).select("fullName");
    const nameOf = new Map(users.map((u) => [u._id.toString(), u.fullName] as [string, string]));

    const items: PendingGradeItem[] = [];
    for (const work of mine) {
      const status = await computeStatus(work, baseDays, now);
      const student = work.student as unknown as { fullName: string };
      const tutorId = work.tutor.toString();

      items.push({
        workId: work._id.toString(),
        studentName: student.fullName,
        tutorName: nameOf.get(tutorId) ?? "",
        defenseDate: work.defense?.date,
        deadline: status.deadline,
        phase: status.phase,
        extraDays: work.gradingExtraDays ?? 0,
        receivedCount: status.receivedCount,
        missing: status.missing.map((id) => ({
          id,
          name: nameOf.get(id) ?? "Un evaluador",
          role: (id === tutorId ? "tutor" : "jury") as "tutor" | "jury",
        })),
      });
    }

    const rank: Record<GradingPhase, number> = { overdue: 0, reminder: 1, waiting: 2, none: 3 };
    items.sort(
      (a, b) =>
        rank[a.phase] - rank[b.phase] ||
        (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0)
    );

    return res.json({ works: items });
  } catch (err) {
    next(err);
  }
}

/**
 * Coordinator: give the graders of one work more days. The missing people get
 * the new date. The reminder starts again, and so does the "overdue" message,
 * unless the new deadline is still in the past.
 */
export async function extendGradingDeadline(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId } = req.params;

    const parsed = parseExtraDays(req.body?.days);
    if (!parsed.ok) return res.status(400).json({ message: parsed.error });

    const loaded = await loadOwnWork(workId, req.user!.userId);
    if (!loaded.ok) return res.status(loaded.status).json({ message: loaded.message });
    const { work, student, baseDays } = loaded;

    const now = new Date();
    const newExtra = (work.gradingExtraDays ?? 0) + parsed.days;
    const deadline = getGradingDeadline(work.defense.date, baseDays + newExtra);
    if (!deadline) return res.status(409).json({ message: "Este trabajo no tiene fecha de defensa" });
    const phase = getGradingPhase(deadline, now, REMINDER_DAYS_BEFORE);

    const unset: Record<string, ""> = { "gradingAlerts.reminderSentAt": "" };
    if (phase !== "overdue") unset["gradingAlerts.overdueSentAt"] = "";

    const updated = await Work.findOneAndUpdate(
      { _id: work._id, stage: { $in: WAITING_STAGES } },
      { $set: { gradingExtraDays: newExtra }, $unset: unset },
      { new: true }
    );
    if (!updated) {
      return res.status(409).json({ message: "Este trabajo ya no está esperando calificaciones" });
    }

    const status = await computeStatus(updated, baseDays, now);
    for (const graderId of status.missing) {
      await notify({
        recipient: graderId,
        type: NotificationType.GRADE,
        title: "Plazo de calificación ampliado",
        message: `El coordinador ha ampliado el plazo: tienes hasta el ${formatDay(deadline)} para calificar el trabajo de ${student.fullName}.`,
        link: `/works/${work._id}/grade`,
      });
    }

    return res.json({
      extraDays: newExtra,
      deadline,
      phase,
      notified: status.missing.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Coordinator: close the grade of one work with the evaluations received, when
 * someone is missing. A reason is required. The final grade is calculated with
 * the grades that exist, the work becomes "graded" but unpublished, and the
 * record of who was missing and why is saved on the work.
 */
export async function closeGradeWithReceived(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId } = req.params;

    const reason = validateClosureReason(req.body?.reason);
    if (!reason.ok) return res.status(400).json({ message: reason.error });

    const loaded = await loadOwnWork(workId, req.user!.userId);
    if (!loaded.ok) return res.status(loaded.status).json({ message: loaded.message });
    const { work, student, baseDays } = loaded;

    const now = new Date();
    const status = await computeStatus(work, baseDays, now);

    const blocker = getClosureBlocker(status.receivedCount, status.missing.length);
    if (blocker) return res.status(409).json({ message: blocker });

    const tutorId = work.tutor.toString();
    const juryIds = (work.defense?.jury ?? []).map((j) => j.toString());
    const tutorGrade = status.grades.find((g) => g.grader.toString() === tutorId);
    const juryScores = status.grades
      .filter((g) => juryIds.includes(g.grader.toString()))
      .map((g) => g.weightedScore);

    const [tutorRubric, juryRubric] = await Promise.all([
      Rubric.findOne({ degree: student.degree, role: RubricRole.TUTOR }),
      Rubric.findOne({ degree: student.degree, role: RubricRole.JURY }),
    ]);

    const finalGrade = calculatePartialFinalGrade(
      tutorGrade ? tutorGrade.weightedScore : null,
      juryScores,
      tutorRubric?.roleWeight ?? DEFAULT_ROLE_WEIGHTS.tutor,
      juryRubric?.roleWeight ?? DEFAULT_ROLE_WEIGHTS.jury
    );
    if (finalGrade === null) {
      return res
        .status(409)
        .json({ message: "Todavía no hay ninguna calificación, así que no se puede cerrar" });
    }

    const missingUsers = await User.find({ _id: { $in: status.missing } }).select("fullName");
    const missingInfo = status.missing.map((id) => ({
      grader: new Types.ObjectId(id),
      name: missingUsers.find((u) => u._id.toString() === id)?.fullName ?? "Un evaluador",
    }));

    const closed = await Work.findOneAndUpdate(
      { _id: work._id, stage: { $in: WAITING_STAGES } },
      {
        $set: {
          stage: WorkStage.GRADED,
          "grade.finalGrade": finalGrade,
          "grade.gradedAt": now,
          "grade.released": false,
          "grade.releasedAt": null,
          gradeClosure: {
            closedAt: now,
            closedBy: new Types.ObjectId(req.user!.userId),
            reason: reason.reason,
            missing: missingInfo,
            receivedCount: status.receivedCount,
          },
        },
      },
      { new: true }
    );
    if (!closed) {
      return res.status(409).json({ message: "Este trabajo ya no está esperando calificaciones" });
    }

    for (const m of missingInfo) {
      await notify({
        recipient: m.grader,
        type: NotificationType.GRADE,
        title: "Calificación cerrada",
        message: `El coordinador ha cerrado la calificación del trabajo de ${student.fullName} con las notas recibidas.`,
        link: "/my-works",
      });
    }

    return res.json({
      finalGrade,
      missing: missingInfo.map((m) => m.name),
      receivedCount: status.receivedCount,
    });
  } catch (err) {
    next(err);
  }
}