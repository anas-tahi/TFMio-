import { Request, Response, NextFunction } from "express";
import { Work } from "../models/Work.js";
import { User } from "../models/User.js";
import { CoordinatorDecision, NotificationType } from "../types/index.js";
import { notify } from "../services/notification.service.js";

/** Coordinator: list all matches pending review for their degree. */
export async function getPendingMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const works = await Work.find({ coordinatorDecision: CoordinatorDecision.PENDING })
      .populate({
        path: "student",
        match: { degree: coordinator.degreeManaged },
        select: "fullName email degree",
      })
      .populate("tutor", "fullName")
      .populate("topic", "title");

    // Mongoose's populate `match` returns null (not filtered out) when the
    // referenced doc doesn't match, so we filter those out here.
    const filtered = works.filter((w) => w.student !== null);

    return res.json({ works: filtered });
  } catch (err) {
    next(err);
  }
}

/** Coordinator: approve, reject, or explicitly not intervene on a match. */
export async function decideMatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { decision, note } = req.body as { decision: CoordinatorDecision; note?: string };

    if (!Object.values(CoordinatorDecision).includes(decision)) {
      return res.status(400).json({ message: "Decisión inválida" });
    }

    const work = await Work.findById(id)
      .populate("student", "fullName")
      .populate("tutor", "fullName")
      .populate("topic", "title");
    if (!work) return res.status(404).json({ message: "No encontrado" });

    work.coordinatorDecision = decision;
    if (decision === CoordinatorDecision.APPROVED) {
      work.approvedByCoordinator = true;
    }
    if (note) work.coordinatorNote = note;
    await work.save();

    const student = work.student as unknown as { _id: string; fullName: string };
    const tutor = work.tutor as unknown as { _id: string; fullName: string };
    const topic = work.topic as unknown as { title: string };

    const decisionLabels: Record<string, string> = {
      [CoordinatorDecision.APPROVED]: "aprobado",
      [CoordinatorDecision.REJECTED]: "rechazado",
      [CoordinatorDecision.NOT_REVIEWED]: "dejado pasar sin revisión",
    };
    const label = decisionLabels[decision] ?? decision;
    const noteText = note ? ` Nota del coordinador: "${note}"` : "";

    // Notify both the student and the tutor — the coordinator's note reaches both.
    for (const recipient of [student._id, tutor._id]) {
      await notify({
        recipient,
        type: NotificationType.APPROVAL,
        title: `Emparejamiento ${label}`,
        message: `El coordinador ha ${label} el emparejamiento para "${topic.title}".${noteText}`,
        link: "/",
      });
    }

    return res.json({ work });
  } catch (err) {
    next(err);
  }
}