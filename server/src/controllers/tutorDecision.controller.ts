import { Request, Response, NextFunction } from "express";
import { Work } from "../models/Work.js";
import { CoordinatorDecision, TutorFinalDecision, WorkStage, NotificationType } from "../types/index.js";
import { notify } from "../services/notification.service.js";

/** Tutor: list matches where the coordinator has given input, awaiting the tutor's final decision. */
export async function getPendingFinalDecisions(req: Request, res: Response, next: NextFunction) {
  try {
    const works = await Work.find({
      tutor: req.user!.userId,
      coordinatorDecision: { $ne: CoordinatorDecision.PENDING },
      tutorFinalDecision: TutorFinalDecision.PENDING,
    })
      .populate("student", "fullName email")
      .populate("topic", "title");

    return res.json({ works });
  } catch (err) {
    next(err);
  }
}

/** Tutor: give the actual final decision on a match, after seeing the coordinator's input. */
export async function decideFinal(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { decision } = req.body as { decision: "confirm" | "cancel" };

    const work = await Work.findById(id)
      .populate("student", "fullName")
      .populate("topic", "title");
    if (!work) return res.status(404).json({ message: "No encontrado" });
    if (work.tutor.toString() !== req.user!.userId) {
      return res.status(403).json({ message: "No autorizado" });
    }
    if (work.coordinatorDecision === CoordinatorDecision.PENDING) {
      return res.status(409).json({ message: "El coordinador aún no ha dado su opinión" });
    }
    if (work.tutorFinalDecision !== TutorFinalDecision.PENDING) {
      return res.status(409).json({ message: "Ya se tomó una decisión final" });
    }

    const student = work.student as unknown as { _id: string; fullName: string };
    const topic = work.topic as unknown as { title: string };

    if (decision === "confirm") {
      work.tutorFinalDecision = TutorFinalDecision.CONFIRMED;
      work.approvedByCoordinator = true;
      work.stage = WorkStage.APPROVED;
      await work.save();

      await notify({
        recipient: student._id,
        type: NotificationType.APPROVAL,
        title: "¡Emparejamiento confirmado!",
        message: `Tu tutor ha confirmado tu tema "${topic.title}" tras la revisión del coordinador. Ya puedes empezar a trabajar.`,
        link: "/",
      });
    } else {
      work.tutorFinalDecision = TutorFinalDecision.CANCELLED;
      await work.save();

      await notify({
        recipient: student._id,
        type: NotificationType.APPROVAL,
        title: "Emparejamiento cancelado",
        message: `Tu tutor ha cancelado el emparejamiento para "${topic.title}" tras la revisión del coordinador.`,
        link: "/",
      });
    }

    return res.json({ work });
  } catch (err) {
    next(err);
  }
}