import { Request, Response, NextFunction } from "express";
import { Grade } from "../models/Grade.js";
import { Rubric } from "../models/Rubric.js";
import { Work } from "../models/Work.js";
import { User } from "../models/User.js";
import { RubricRole, WorkStage, NotificationType } from "../types/index.js";
import { notify } from "../services/notification.service.js";

/** Anyone involved (tutor or jury member) fetches the rubric they need to grade with. */
export async function getRubricForGrading(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId, role } = req.params as { workId: string; role: RubricRole };

    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ message: "No encontrado" });

    const isTutor = work.tutor.toString() === req.user!.userId;
    const isJury = (work.defense?.jury ?? []).some((j) => j.toString() === req.user!.userId);
    if (!isTutor && !isJury) return res.status(403).json({ message: "No autorizado" });

    const student = await User.findById(work.student);
    const rubric = await Rubric.findOne({ degree: student?.degree, role });
    if (!rubric) return res.status(404).json({ message: "No hay rúbrica configurada para este rol" });

    return res.json({ rubric });
  } catch (err) {
    next(err);
  }
}

/** Tutor or a jury member submits their scores for a work, using the rubric for their role. */
export async function submitGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId } = req.params;
    const { scores } = req.body as { scores: { name: string; points: number }[] };

    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ message: "No encontrado" });
    if (work.stage !== WorkStage.DEFENDED && work.stage !== WorkStage.DEFENSE_READY) {
      return res.status(409).json({ message: "Este trabajo aún no está listo para calificar" });
    }

    const isTutor = work.tutor.toString() === req.user!.userId;
    const isJury = (work.defense?.jury ?? []).some((j) => j.toString() === req.user!.userId);
    if (!isTutor && !isJury) return res.status(403).json({ message: "No autorizado" });

    const role: RubricRole = isTutor ? RubricRole.TUTOR : RubricRole.JURY;

    const student = await User.findById(work.student);
    const rubric = await Rubric.findOne({ degree: student?.degree, role });
    if (!rubric) return res.status(400).json({ message: "No hay rúbrica configurada" });

    // Compute this grader's weighted score (0–10) from their per-criterion points.
    let weightedSum = 0;
    let weightTotal = 0;
    for (const criterion of rubric.criteria) {
      const given = scores.find((s) => s.name === criterion.name);
      const points = given?.points ?? 0;
      const normalized = (points / criterion.maxPoints) * 10; // scale to 0–10
      weightedSum += normalized * criterion.weight;
      weightTotal += criterion.weight;
    }
    const weightedScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

    const grade = await Grade.findOneAndUpdate(
      { work: workId, grader: req.user!.userId },
      { role, scores, weightedScore },
      { new: true, upsert: true }
    );

    // Check if everyone required has graded (tutor + all jury members) — if so, compute the final grade.
    await tryFinalizeGrade(workId, work);

    return res.status(201).json({ grade });
  } catch (err) {
    next(err);
  }
}

/**
 * If the tutor and every jury member have all submitted a grade, compute the
 * final weighted grade (using each role's rubric.roleWeight) and save it on
 * the Work, moving its stage to "graded".
 */
async function tryFinalizeGrade(workId: string, work: InstanceType<typeof Work>) {
  const juryIds = (work.defense?.jury ?? []).map((j) => j.toString());
  const expectedGraders = [work.tutor.toString(), ...juryIds];

  const grades = await Grade.find({ work: workId });
  const gradedBy = grades.map((g) => g.grader.toString());

  const allGraded = expectedGraders.every((id) => gradedBy.includes(id));
  if (!allGraded) return;

  const student = await User.findById(work.student);
  const tutorRubric = await Rubric.findOne({ degree: student?.degree, role: RubricRole.TUTOR });
  const juryRubric = await Rubric.findOne({ degree: student?.degree, role: RubricRole.JURY });

  const tutorGrade = grades.find((g) => g.grader.toString() === work.tutor.toString());
  const juryGrades = grades.filter((g) => juryIds.includes(g.grader.toString()));

  const tutorAvg = tutorGrade?.weightedScore ?? 0;
  const juryAvg =
    juryGrades.length > 0
      ? juryGrades.reduce((sum, g) => sum + g.weightedScore, 0) / juryGrades.length
      : 0;

  const tutorWeight = tutorRubric?.roleWeight ?? 0.5;
  const juryWeight = juryRubric?.roleWeight ?? 0.5;
  const totalWeight = tutorWeight + juryWeight;

  const finalGrade =
    totalWeight > 0 ? (tutorAvg * tutorWeight + juryAvg * juryWeight) / totalWeight : 0;

  await Work.findByIdAndUpdate(workId, {
    stage: WorkStage.GRADED,
    "grade.finalGrade": Math.round(finalGrade * 100) / 100,
    "grade.gradedAt": new Date(),
  });

  if (student) {
    await notify({
      recipient: student._id,
      type: NotificationType.GRADE,
      title: "¡Calificación final disponible!",
      message: `Tu nota final es ${(Math.round(finalGrade * 100) / 100).toFixed(2)} / 10.`,
      link: "/",
    });
  }
}

/** Get every grade already submitted for a work (visible to tutor, jury, and coordinator). */
export async function getGradesForWork(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId } = req.params;
    const grades = await Grade.find({ work: workId }).populate("grader", "fullName");
    return res.json({ grades });
  } catch (err) {
    next(err);
  }
}