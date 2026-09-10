import { Request, Response, NextFunction } from "express";
import { Work } from "../models/Work.js";
import { User } from "../models/User.js";
import { WorkStage, NotificationType, UserRole } from "../types/index.js";
import { notify } from "../services/notification.service.js";

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