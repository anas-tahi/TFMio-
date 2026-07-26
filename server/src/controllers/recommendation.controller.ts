import { Request, Response, NextFunction } from "express";
import { User } from "../models/User.js";
import { Topic } from "../models/Topic.js";
import { cosineSimilarity } from "../services/llm.service.js";
import { TopicStatus } from "../types/index.js";

/**
 * Return every active topic ranked by similarity to the logged-in student's
 * profile embedding, from most to least relevant (feature #35).
 *
 * This compares the student's embedding against every active topic's
 * embedding using cosine similarity, computed directly in Node.js. For the
 * scale of this platform (a school's worth of topics — hundreds, not
 * millions), this is simpler to run and test than configuring MongoDB
 * Atlas's native $vectorSearch index, while being mathematically identical.
 */
export async function getRecommendations(req: Request, res: Response, next: NextFunction) {
  try {
    // The embedding field is excluded by default (select: false) — ask for it explicitly.
    const student = await User.findById(req.user!.userId).select("+embedding");
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.embedding || student.embedding.length === 0) {
      return res.status(400).json({
        message: "Completa tu perfil primero para recibir recomendaciones",
      });
    }

    const topics = await Topic.find({ status: TopicStatus.ACTIVE })
      .select("+embedding")
      .populate("tutor", "fullName department")
      .populate("degrees", "shortName");

    const ranked = topics
      .filter((topic) => topic.embedding && topic.embedding.length > 0)
      .map((topic) => {
        const score = cosineSimilarity(student.embedding!, topic.embedding!);
        const topicObj = topic.toJSON() as Record<string, unknown>;
        return {
          ...topicObj,
          matchScore: Math.round(score * 100), // 0–100, shown as "% match" on cards
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.json({ recommendations: ranked });
  } catch (err) {
    next(err);
  }
}