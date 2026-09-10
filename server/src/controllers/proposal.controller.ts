import { Request, Response, NextFunction } from "express";
import { TopicProposal } from "../models/TopicProposal.js";
import { User } from "../models/User.js";
import { Work } from "../models/Work.js";
import { Topic } from "../models/Topic.js";
import { Interest } from "../models/Interest.js";
import { ProposalStatus, WorkStage, TopicStatus, NotificationType, UserRole, InterestStatus } from "../types/index.js";
import { notify } from "../services/notification.service.js";

const MAX_MATCHES_PER_TUTOR = 4;

/** True if the student already has an active match (not rejected/closed). */
async function hasActiveMatch(studentId: string): Promise<boolean> {
  const count = await Work.countDocuments({ student: studentId });
  return count > 0;
}

/**
 * Cancels every other pending interest/proposal a student has, once one of
 * theirs gets accepted — since a student can only work on one topic at a time.
 */
async function cancelOtherPendingRequests(studentId: string, keepProposalId?: string) {
  await Interest.updateMany(
    { student: studentId, status: InterestStatus.PENDING },
    { status: InterestStatus.REJECTED }
  );
  await TopicProposal.updateMany(
    {
      student: studentId,
      status: { $in: [ProposalStatus.PENDING, ProposalStatus.REVISION_REQUESTED] },
      ...(keepProposalId ? { _id: { $ne: keepProposalId } } : {}),
    },
    { status: ProposalStatus.REJECTED }
  );
}

/** Student: propose a new topic idea to a specific tutor. */
export async function createProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const { tutorId, title, description, type } = req.body as {
      tutorId: string;
      title: string;
      description: string;
      type: "TFM" | "TFG";
    };

    if (await hasActiveMatch(req.user!.userId)) {
      return res.status(409).json({ message: "Ya tienes un tema asignado" });
    }

    const tutor = await User.findOne({ _id: tutorId, role: UserRole.TUTOR });
    if (!tutor) return res.status(404).json({ message: "Tutor no encontrado" });

    const proposal = await TopicProposal.create({
      student: req.user!.userId,
      tutor: tutorId,
      title,
      description,
      type,
      status: ProposalStatus.PENDING,
    });

    const student = await User.findById(req.user!.userId);

    await notify({
      recipient: tutorId,
      type: NotificationType.INTEREST,
      title: "Nueva propuesta de tema",
      message: `${student?.fullName} te ha propuesto un tema: "${title}"`,
      link: "/proposals",
    });

    return res.status(201).json({ proposal });
  } catch (err) {
    next(err);
  }
}

/** Student: list their own proposals. */
export async function getMyProposals(req: Request, res: Response, next: NextFunction) {
  try {
    const proposals = await TopicProposal.find({ student: req.user!.userId })
      .populate("tutor", "fullName")
      .sort({ updatedAt: -1 });
    return res.json({ proposals });
  } catch (err) {
    next(err);
  }
}

/** Tutor: list proposals sent to them. */
export async function getReceivedProposals(req: Request, res: Response, next: NextFunction) {
  try {
    const proposals = await TopicProposal.find({ tutor: req.user!.userId })
      .populate("student", "fullName email")
      .sort({ updatedAt: -1 });
    return res.json({ proposals });
  } catch (err) {
    next(err);
  }
}

/** Student: edit and resubmit a proposal after the tutor requested changes. */
export async function updateProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { title, description } = req.body as { title: string; description: string };

    const proposal = await TopicProposal.findById(id);
    if (!proposal) return res.status(404).json({ message: "Propuesta no encontrada" });
    if (proposal.student.toString() !== req.user!.userId) {
      return res.status(403).json({ message: "No autorizado" });
    }
    if (proposal.status !== ProposalStatus.REVISION_REQUESTED) {
      return res.status(409).json({ message: "Esta propuesta no está pendiente de cambios" });
    }

    proposal.title = title;
    proposal.description = description;
    proposal.status = ProposalStatus.PENDING;
    proposal.revisionCount += 1;
    await proposal.save();

    await notify({
      recipient: proposal.tutor,
      type: NotificationType.INTEREST,
      title: "Propuesta actualizada",
      message: `Se ha reenviado la propuesta "${title}" con los cambios solicitados`,
      link: "/proposals",
    });

    return res.json({ proposal });
  } catch (err) {
    next(err);
  }
}

/** Tutor: accept, reject, or request changes on a proposal. */
export async function decideProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { decision, note } = req.body as {
      decision: "accept" | "reject" | "request_changes";
      note?: string;
    };

    const proposal = await TopicProposal.findById(id).populate("student", "fullName");
    if (!proposal) return res.status(404).json({ message: "Propuesta no encontrada" });
    if (proposal.tutor.toString() !== req.user!.userId) {
      return res.status(403).json({ message: "No autorizado" });
    }
    if (proposal.status !== ProposalStatus.PENDING) {
      return res.status(409).json({ message: "Esta propuesta ya fue procesada" });
    }

    const student = proposal.student as unknown as { _id: string; fullName: string };

    if (decision === "request_changes") {
      if (!note) return res.status(400).json({ message: "Debes indicar qué cambiar" });
      proposal.status = ProposalStatus.REVISION_REQUESTED;
      proposal.revisionNote = note;
      await proposal.save();

      await notify({
        recipient: student._id,
        type: NotificationType.INTEREST,
        title: "Cambios solicitados en tu propuesta",
        message: `Tu tutor pide cambios en "${proposal.title}": "${note}"`,
        link: "/my-proposals",
      });

      return res.json({ proposal });
    }

    if (decision === "reject") {
      proposal.status = ProposalStatus.REJECTED;
      if (note) proposal.revisionNote = note;
      await proposal.save();

      await notify({
        recipient: student._id,
        type: NotificationType.INTEREST,
        title: "Propuesta rechazada",
        message: `Tu tutor ha rechazado la propuesta "${proposal.title}"${note ? `: "${note}"` : ""}`,
        link: "/my-proposals",
      });

      return res.json({ proposal });
    }

    // decision === "accept"
    if (await hasActiveMatch(student._id)) {
      return res.status(409).json({ message: "Este estudiante ya tiene un tema asignado" });
    }

    const activeMatchCount = await Work.countDocuments({
      tutor: proposal.tutor,
      stage: { $ne: WorkStage.GRADED },
    });
    if (activeMatchCount >= MAX_MATCHES_PER_TUTOR) {
      return res.status(409).json({
        message: `Ya tienes el máximo de ${MAX_MATCHES_PER_TUTOR} estudiantes asignados`,
      });
    }

    proposal.status = ProposalStatus.ACCEPTED;
    await proposal.save();

    const tutorUser = await User.findById(proposal.tutor);
    const studentUser = await User.findById(student._id);

    // Auto-create a real Topic from the accepted proposal, so every Work still
    // points to a valid Topic — keeps the rest of the app (which expects
    // work.topic.title everywhere) working without changes. Scoped to the
    // student's own degree, since that's the only degree this topic is
    // actually relevant to. status: CLOSED means it won't show up in other
    // students' recommendations.
    const topic = await Topic.create({
      title: proposal.title,
      description: proposal.description,
      tutor: proposal.tutor,
      department: tutorUser?.department ?? "",
      degrees: studentUser?.degree ? [studentUser.degree] : [],
      type: proposal.type,
      totalSpots: 1,
      status: TopicStatus.CLOSED,
    });

    await Work.create({
      student: student._id,
      tutor: proposal.tutor,
      topic: topic._id,
      type: proposal.type,
      stage: WorkStage.MATCHED,
    });

    // A student can only work on one topic — cancel any other pending requests they have.
    await cancelOtherPendingRequests(student._id, proposal._id.toString());

    await notify({
      recipient: student._id,
      type: NotificationType.MATCH,
      title: "¡Propuesta aceptada!",
      message: `Tu tutor ha aceptado tu propuesta "${proposal.title}". Ahora está pendiente de aprobación por el coordinador.`,
      link: "/",
    });

    return res.json({ proposal });
  } catch (err) {
    next(err);
  }
}