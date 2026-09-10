import { Request, Response, NextFunction } from "express";
import { Interest } from "../models/Interest.js";
import { Topic } from "../models/Topic.js";
import { User } from "../models/User.js";
import { Work } from "../models/Work.js";
import { TopicProposal } from "../models/TopicProposal.js";
import { Degree } from "../models/Degree.js";
import { cosineSimilarity, buildProfileText, generateMatchSummary } from "../services/llm.service.js";
import { InterestStatus, TopicStatus, WorkStage, NotificationType, ProposalStatus } from "../types/index.js";
import { notify } from "../services/notification.service.js";

const MAX_MATCHES_PER_TUTOR = 4;

/** True if the student already has an active match (not rejected/closed). */
async function hasActiveMatch(studentId: string): Promise<boolean> {
  const count = await Work.countDocuments({ student: studentId });
  return count > 0;
}

/**
 * Checks if the matching deadline for a student's degree has already passed.
 * Returns null if there's no deadline set (no restriction).
 */
async function isPastMatchingDeadline(degreeId?: unknown): Promise<boolean> {
  if (!degreeId) return false;
  const degree = await Degree.findById(degreeId);
  if (!degree?.matchingDeadline) return false;
  return new Date() > degree.matchingDeadline;
}

/**
 * Cancels every other pending interest/proposal a student has, once one of
 * theirs gets accepted — since a student can only work on one topic at a time.
 */
async function cancelOtherPendingRequests(studentId: string, keepInterestId?: string) {
  await Interest.updateMany(
    {
      student: studentId,
      status: InterestStatus.PENDING,
      ...(keepInterestId ? { _id: { $ne: keepInterestId } } : {}),
    },
    { status: InterestStatus.REJECTED }
  );
  await TopicProposal.updateMany(
    { student: studentId, status: { $in: [ProposalStatus.PENDING, ProposalStatus.REVISION_REQUESTED] } },
    { status: ProposalStatus.REJECTED }
  );
}

/**
 * Student expresses interest in a topic (feature: "Me interesa").
 * Stores the match score at this moment and generates the AI explanation
 * the tutor will see, so the tutor never has to wait for it later.
 */
export async function createInterest(req: Request, res: Response, next: NextFunction) {
  try {
    const { topicId, studentNote } = req.body as { topicId: string; studentNote?: string };

    const student = await User.findById(req.user!.userId).select("+embedding");
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!student.embedding || student.embedding.length === 0) {
      return res.status(400).json({ message: "Completa tu perfil primero" });
    }

    if (await hasActiveMatch(student._id.toString())) {
      return res.status(409).json({ message: "Ya tienes un tema asignado" });
    }

    if (await isPastMatchingDeadline(student.degree)) {
      return res.status(409).json({
        message: "El plazo para elegir tutor ha finalizado. Contacta con tu coordinador.",
      });
    }

    const topic = await Topic.findById(topicId).select("+embedding");
    if (!topic || topic.status !== TopicStatus.ACTIVE) {
      return res.status(404).json({ message: "Tema no encontrado o no disponible" });
    }

    const existing = await Interest.findOne({ student: student._id, topic: topic._id });
    if (existing) {
      return res.status(409).json({ message: "Ya has mostrado interés en este tema" });
    }

    const matchScore = Math.round(
      cosineSimilarity(student.embedding, topic.embedding ?? []) * 100
    );

    const profileText = buildProfileText({
      skills: student.skills,
      interests: student.interests,
      workStyle: student.workStyle,
    });

    // Generate the AI explanation now, so the tutor sees it instantly later.
    const aiMatchSummary = await generateMatchSummary(profileText, topic.title, topic.description);

    const interest = await Interest.create({
      student: student._id,
      topic: topic._id,
      tutor: topic.tutor,
      status: InterestStatus.PENDING,
      matchScore,
      aiMatchSummary,
      studentNote,
    });

    await notify({
      recipient: topic.tutor,
      type: NotificationType.INTEREST,
      title: "Nuevo estudiante interesado",
      message: `${student.fullName} ha mostrado interés en tu tema "${topic.title}"`,
      link: "/requests",
    });

    return res.status(201).json({ interest });
  } catch (err) {
    next(err);
  }
}

/** Tutor: list every pending interest on their topics, most recent first. */
export async function getMyInterests(req: Request, res: Response, next: NextFunction) {
  try {
    const interests = await Interest.find({ tutor: req.user!.userId })
      .populate("student", "fullName email skills interests workStyle")
      .populate("topic", "title")
      .sort({ createdAt: -1 });

    return res.json({ interests });
  } catch (err) {
    next(err);
  }
}

/** Tutor: accept or reject a pending interest. Accepting creates the official Work (match). */
export async function decideInterest(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { decision } = req.body as { decision: "accept" | "reject" };

    const interest = await Interest.findById(id).populate("topic").populate("student", "fullName");
    if (!interest) return res.status(404).json({ message: "Solicitud no encontrada" });
    if (interest.tutor.toString() !== req.user!.userId) {
      return res.status(403).json({ message: "No autorizado" });
    }
    if (interest.status !== InterestStatus.PENDING) {
      return res.status(409).json({ message: "Esta solicitud ya fue procesada" });
    }

    const student = interest.student as unknown as { _id: string; fullName: string };
    const topic = interest.topic as unknown as { _id: string; type: "TFM" | "TFG"; title: string };

    if (decision === "accept") {
      const activeMatchCount = await Work.countDocuments({
        tutor: interest.tutor,
        stage: { $ne: WorkStage.GRADED }, // count anything not fully finished
      });
      if (activeMatchCount >= MAX_MATCHES_PER_TUTOR) {
        return res.status(409).json({
          message: `Ya tienes el máximo de ${MAX_MATCHES_PER_TUTOR} estudiantes asignados`,
        });
      }
      if (await hasActiveMatch(student._id)) {
        return res.status(409).json({ message: "Este estudiante ya tiene un tema asignado" });
      }
    }

    interest.status = decision === "accept" ? InterestStatus.ACCEPTED : InterestStatus.REJECTED;
    await interest.save();

    if (decision === "accept") {
      await Work.create({
        student: student._id,
        tutor: interest.tutor,
        topic: topic._id,
        type: topic.type,
        stage: WorkStage.MATCHED,
      });

      // A student can only work on one topic — cancel any other pending requests they have.
      await cancelOtherPendingRequests(student._id, interest._id.toString());

      await notify({
        recipient: student._id,
        type: NotificationType.MATCH,
        title: "¡Solicitud aceptada!",
        message: `Tu tutor ha aceptado tu interés en "${topic.title}". Ahora está pendiente de aprobación por el coordinador.`,
        link: "/",
      });
    } else {
      await notify({
        recipient: student._id,
        type: NotificationType.INTEREST,
        title: "Solicitud rechazada",
        message: `Tu tutor ha rechazado tu interés en "${topic.title}"`,
        link: "/recommendations",
      });
    }

    return res.json({ interest });
  } catch (err) {
    next(err);
  }
}