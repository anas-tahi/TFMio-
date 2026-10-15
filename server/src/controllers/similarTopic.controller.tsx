import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { Topic } from "../models/Topic.js";
import { embed } from "../services/llm.service.js";
import { buildTopicText } from "../utils/topicText.js";
import { findSimilarAboveThreshold } from "../utils/similarTopics.js";
import { toPercent } from "../utils/similarity.js";
import { UserRole, TopicStatus } from "../types/index.js";
import { SIMILAR_TOPIC_THRESHOLD, MAX_SIMILAR_TOPICS } from "../config/similarity.js";

const similarTopicsSchema = z.object({
  title: z.string().max(200).default(""),
  description: z.string().max(4000).default(""),
  skills: z.array(z.string().max(60)).max(20).optional(),
});

/**
 * Student or tutor: list already-published topics that look similar to the
 * text they are writing (a proposal, or a topic about to be published). Scoped
 * to the user's own degree(s). Nothing is stored. If the embedding service is
 * down it answers 503 and the forms keep working without the notice.
 */
export async function suggestSimilarTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, skills } = similarTopicsSchema.parse(req.body);

    if (title.trim().length < 5 || description.trim().length < 20) {
      return res
        .status(400)
        .json({ message: "Escribe un título y una descripción algo más largos" });
    }

    const user = await User.findById(req.user!.userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const degreeIds =
      user.role === UserRole.STUDENT ? (user.degree ? [user.degree] : []) : (user.degrees ?? []);
    if (degreeIds.length === 0) return res.json({ similar: [] });

    let query: number[];
    try {
      query = await embed(buildTopicText({ title, description, skills }));
    } catch (err) {
      console.warn("Similar-topic check unavailable, the embedding failed:", err);
      return res.status(503).json({ message: "El servicio de IA no está disponible ahora mismo" });
    }

    const topics = await Topic.find({ status: TopicStatus.ACTIVE, degrees: { $in: degreeIds } })
      .select("+embedding")
      .populate("tutor", "fullName")
      .lean();

    const matches = findSimilarAboveThreshold(
      query,
      topics,
      (topic) => topic.embedding,
      SIMILAR_TOPIC_THRESHOLD,
      MAX_SIMILAR_TOPICS
    );

    return res.json({
      similar: matches.map(({ item, score }) => {
        const tutor = item.tutor as unknown as {
          _id: { toString(): string };
          fullName?: string;
        } | null;
        return {
          topicId: item._id.toString(),
          title: item.title,
          tutorName: tutor?.fullName ?? "",
          type: item.type,
          score: toPercent(score),
          isOwn: tutor?._id.toString() === req.user!.userId,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}