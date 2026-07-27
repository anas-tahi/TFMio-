import { Request, Response, NextFunction } from "express";
import { Interest } from "../models/Interest.js";
import { Topic } from "../models/Topic.js";
import { User } from "../models/User.js";
import { Work } from "../models/Work.js";
import { cosineSimilarity, buildProfileText, generateMatchSummary } from "../services/llm.service.js";
import { InterestStatus, TopicStatus, WorkStage } from "../types/index.js";

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

    const interest = await Interest.findById(id).populate("topic");
    if (!interest) return res.status(404).json({ message: "Solicitud no encontrada" });
    if (interest.tutor.toString() !== req.user!.userId) {
      return res.status(403).json({ message: "No autorizado" });
    }
    if (interest.status !== InterestStatus.PENDING) {
      return res.status(409).json({ message: "Esta solicitud ya fue procesada" });
    }

    interest.status = decision === "accept" ? InterestStatus.ACCEPTED : InterestStatus.REJECTED;
    await interest.save();

    if (decision === "accept") {
      const topic = interest.topic as unknown as { _id: string; type: "TFM" | "TFG" };
      await Work.create({
        student: interest.student,
        tutor: interest.tutor,
        topic: topic._id,
        type: topic.type,
        stage: WorkStage.MATCHED,
      });
    }

    return res.json({ interest });
  } catch (err) {
    next(err);
  }
}