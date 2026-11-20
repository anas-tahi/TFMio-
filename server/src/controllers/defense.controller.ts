import { Request, Response, NextFunction } from "express";
import { Work } from "../models/Work.js";
import { User } from "../models/User.js";
import { Topic } from "../models/Topic.js";
import { WorkStage, NotificationType, UserRole } from "../types/index.js";
import { notify } from "../services/notification.service.js";
import { suggestJury } from "../utils/jurySuggestion.js";
import { DEFAULT_JURY_SIZE, MAX_SCORE_DROP_FOR_DIVERSITY } from "../config/jurySuggestion.js";
import { findDefenseConflicts, type ScheduledDefense } from "../utils/defenseConflicts.js";

/** Coordinator: list matches in their degree that are ready for defense scheduling. */
export async function getDefenseReadyMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const works = await Work.find({ stage: WorkStage.DEFENSE_READY })
      .populate({
        path: "student",
        match: { degree: coordinator.degreeManaged },
        select: "fullName email",
      })
      .populate("tutor", "fullName")
      .populate("topic", "title");

    const filtered = works.filter((w) => w.student !== null);

    return res.json({ works: filtered });
  } catch (err) {
    next(err);
  }
}

/** Coordinator: list tutors in their degree, to pick as jury members. */
export async function getJuryPool(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const tutors = await User.find({
      role: UserRole.TUTOR,
      degrees: coordinator.degreeManaged,
    }).select("fullName department");

    return res.json({ tutors });
  } catch (err) {
    next(err);
  }
}

/**
 * Coordinator: AI-suggested jury for one work, ranked by closeness between the
 * topic and each candidate tutor's profile/topics, excluding the work's own
 * tutor and trying to avoid 3 members from the same department. Up to
 * DEFAULT_JURY_SIZE names; the coordinator picks freely from the pool either way.
 */
export async function getJurySuggestion(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const work = await Work.findById(req.params.workId);
    if (!work) return res.status(404).json({ message: "No encontrado" });

    const topic = await Topic.findById(work.topic).select("+embedding");
    if (!topic?.embedding || topic.embedding.length === 0) {
      return res
        .status(409)
        .json({ message: "Este tema todavía no tiene un perfil de IA calculado" });
    }

    const candidates = await User.find({
      role: UserRole.TUTOR,
      degrees: coordinator.degreeManaged,
      _id: { $ne: work.tutor },
    })
      .select("fullName department")
      .select("+embedding");

    const suggestions = suggestJury(
      topic.embedding,
      candidates.map((c) => ({
        tutorId: c._id.toString(),
        department: c.department ?? "",
        embedding: c.embedding,
      })),
      work.tutor.toString(),
      DEFAULT_JURY_SIZE,
      MAX_SCORE_DROP_FOR_DIVERSITY
    );

    const byId = new Map(candidates.map((c) => [c._id.toString(), c]));
    const result = suggestions.map((s) => ({
      tutorId: s.tutorId,
      fullName: byId.get(s.tutorId)?.fullName ?? "",
      department: s.department,
      score: s.score,
    }));

    return res.json({ suggestions: result });
  } catch (err) {
    next(err);
  }
}

/** Builds a human-readable name for a conflict's "detail" field (a room name stays as-is; a person id is resolved to a name). */
async function describeConflictDetail(detail: string, type: "room" | "person"): Promise<string> {
  if (type === "room") return detail;
  const person = await User.findById(detail).select("fullName");
  return person?.fullName ?? "Una persona";
}

/** Coordinator: schedule a defense — date, time, room, and jury members. */
export async function scheduleDefense(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { date, time, room, jury } = req.body as {
      date: string;
      time: string;
      room: string;
      jury: string[];
    };

    if (!date || !time || !room || !jury || jury.length === 0) {
      return res.status(400).json({ message: "Faltan datos de la defensa" });
    }

    const work = await Work.findById(id).populate("student", "fullName").populate("topic", "title");
    if (!work) return res.status(404).json({ message: "No encontrado" });
    if (work.stage !== WorkStage.DEFENSE_READY) {
      return res.status(409).json({ message: "Este trabajo no está listo para la defensa" });
    }

    // Check this candidate slot against every other work that already has a defense date,
    // so the same room or the same tutor/jury member is never double-booked.
    const others = await Work.find({
      _id: { $ne: id },
      "defense.date": { $ne: null },
    }).populate("student", "fullName");

    const existingSlots: ScheduledDefense[] = others.map((o) => ({
      workId: o._id.toString(),
      date: o.defense.date as Date,
      time: o.defense.time ?? "",
      room: o.defense.room ?? "",
      people: [o.tutor.toString(), ...(o.defense.jury ?? []).map((j) => j.toString())],
    }));

    const candidateSlot: ScheduledDefense = {
      workId: id,
      date: new Date(date),
      time,
      room,
      people: [work.tutor.toString(), ...jury],
    };

    const conflicts = findDefenseConflicts(candidateSlot, existingSlots);
    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      const otherWork = others.find((o) => o._id.toString() === conflict.withWorkId);
      const otherStudent = otherWork?.student as unknown as { fullName: string } | undefined;
      const who = await describeConflictDetail(conflict.detail, conflict.type);

      const message =
        conflict.type === "room"
          ? `La sala "${who}" ya está ocupada a esa hora, en la defensa de ${otherStudent?.fullName ?? "otro estudiante"}.`
          : `${who} ya tiene otra defensa a esa hora, en la de ${otherStudent?.fullName ?? "otro estudiante"}.`;

      return res.status(409).json({ message });
    }

    work.defense = {
      date: new Date(date),
      time,
      room,
      jury: jury as unknown as (typeof work.defense.jury),
    };
    await work.save();

    const student = work.student as unknown as { _id: string; fullName: string };
    const topic = work.topic as unknown as { title: string };
    const dateLabel = new Date(date).toLocaleDateString("es-ES");

    // Notify student, tutor, and every jury member
    const recipients = [student._id, work.tutor, ...jury];
    for (const recipient of recipients) {
      await notify({
        recipient,
        type: NotificationType.DEFENSE,
        title: "Defensa programada",
        message: `Defensa de "${topic.title}" — ${dateLabel} a las ${time}, sala ${room}.`,
        link: "/",
      });
    }

    return res.json({ work });
  } catch (err) {
    next(err);
  }
}