import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { User } from "../models/User.js";
import { Topic } from "../models/Topic.js";
import { Work } from "../models/Work.js";
import { embed } from "../services/llm.service.js";
import { bestTutorScore, toPercent } from "../utils/similarity.js";
import { UserRole, TopicStatus, WorkStage } from "../types/index.js";
import { MAX_MATCHES_PER_TUTOR } from "../config/limits.js";

const suggestTutorsSchema = z.object({
  title: z.string().max(200).default(""),
  description: z.string().max(4000).default(""),
});

const MIN_DESCRIPTION_LENGTH = 20;
const MAX_SUGGESTIONS = 5;

interface TutorSuggestion {
  tutorId: string;
  fullName: string;
  department: string;
  areas: string[];
  score: number; // 0-100
  source: "profile" | "topic";
  topicTitle?: string;
  atCapacity: boolean;
}

/**
 * Student: rank the tutors of their own degree by how well each one fits a
 * proposal they are writing. Each tutor is scored on the best match between
 * the proposal and either their profile or one of their active topics.
 * Nothing is stored; this is computed on request. If the embedding service is
 * down it answers 503, and the form simply works without suggestions.
 */
export async function suggestTutors(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description } = suggestTutorsSchema.parse(req.body);

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      return res
        .status(400)
        .json({ message: "Escribe una descripción algo más larga para recibir sugerencias" });
    }

    const student = await User.findById(req.user!.userId);
    if (!student?.degree) {
      return res.status(400).json({ message: "Completa tu perfil primero" });
    }

    let query: number[];
    try {
      query = await embed(`${title.trim()}. ${description.trim()}`);
    } catch (err) {
      console.warn("Tutor suggestions unavailable, the embedding failed:", err);
      return res.status(503).json({ message: "El servicio de IA no está disponible ahora mismo" });
    }

    const tutors = await User.find({ role: UserRole.TUTOR, degrees: student.degree })
      .select("+embedding")
      .lean();

    if (tutors.length === 0) return res.json({ suggestions: [], unranked: 0 });

    const tutorIds = tutors.map((t) => t._id);

    const topics = await Topic.find({ tutor: { $in: tutorIds }, status: TopicStatus.ACTIVE })
      .select("+embedding")
      .lean();

    const topicsByTutor = new Map<string, { title: string; embedding: number[] }[]>();
    for (const topic of topics) {
      if (!topic.embedding || topic.embedding.length === 0) continue;
      const key = topic.tutor.toString();
      const list = topicsByTutor.get(key) ?? [];
      list.push({ title: topic.title, embedding: topic.embedding });
      topicsByTutor.set(key, list);
    }

    // How many students each tutor is already supervising (anything not yet graded).
    const loads = await Work.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { tutor: { $in: tutorIds }, stage: { $ne: WorkStage.GRADED } } },
      { $group: { _id: "$tutor", count: { $sum: 1 } } },
    ]);
    const loadByTutor = new Map(loads.map((l) => [l._id.toString(), l.count]));

    const suggestions: TutorSuggestion[] = [];
    let unranked = 0;

    for (const tutor of tutors) {
      const key = tutor._id.toString();
      const tutorTopics = topicsByTutor.get(key) ?? [];
      const match = bestTutorScore(
        query,
        tutor.embedding,
        tutorTopics.map((t) => t.embedding)
      );

      if (!match) {
        unranked++;
        continue;
      }

      suggestions.push({
        tutorId: key,
        fullName: tutor.fullName,
        department: tutor.department ?? "",
        areas: tutor.areas ?? [],
        score: toPercent(match.score),
        source: match.source,
        topicTitle:
          match.source === "topic" && match.topicIndex !== undefined
            ? tutorTopics[match.topicIndex]?.title
            : undefined,
        atCapacity: (loadByTutor.get(key) ?? 0) >= MAX_MATCHES_PER_TUTOR,
      });
    }

    // Tutors who can still take students first, then by score.
    suggestions.sort(
      (a, b) => Number(a.atCapacity) - Number(b.atCapacity) || b.score - a.score
    );

    return res.json({ suggestions: suggestions.slice(0, MAX_SUGGESTIONS), unranked });
  } catch (err) {
    next(err);
  }
}