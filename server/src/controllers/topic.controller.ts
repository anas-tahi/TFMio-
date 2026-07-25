import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Topic } from "../models/Topic.js";
import { embed } from "../services/llm.service.js";
import { WorkType, TopicStatus } from "../types/index.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const createTopicSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  department: z.string().min(2),
  degrees: z.array(objectId).min(1, "Selecciona al menos una titulación"),
  type: z.nativeEnum(WorkType),
  skills: z.array(z.string()).optional(),
  totalSpots: z.number().min(1).optional(),
  status: z.nativeEnum(TopicStatus).optional(), // "draft" or "active"
});

/** Build the text sent to the embedding model from a topic's title + description + skills. */
function buildTopicText(topic: { title: string; description: string; skills?: string[] }): string {
  const parts = [topic.title, topic.description];
  if (topic.skills?.length) parts.push(`Skills: ${topic.skills.join(", ")}`);
  return parts.join(". ");
}

/**
 * Create a new topic for the logged-in tutor.
 * If status is "active" (published), the topic gets embedded immediately (feature #34)
 * so it's ready to be matched against student profiles right away.
 */
export async function createTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createTopicSchema.parse(req.body);

    const topic = new Topic({
      ...data,
      tutor: req.user!.userId,
      status: data.status ?? TopicStatus.DRAFT,
    });

    if (topic.status === TopicStatus.ACTIVE) {
      const text = buildTopicText(topic);
      topic.embedding = await embed(text);
    }

    await topic.save();
    return res.status(201).json({ topic });
  } catch (err) {
    next(err);
  }
}

/**
 * Publish a draft topic — embeds it now if it wasn't already.
 */
export async function publishTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const topic = await Topic.findOne({ _id: req.params.id, tutor: req.user!.userId }).select("+embedding");
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    if (!topic.embedding) {
      const text = buildTopicText(topic);
      topic.embedding = await embed(text);
    }
    topic.status = TopicStatus.ACTIVE;
    await topic.save();

    return res.json({ topic });
  } catch (err) {
    next(err);
  }
}

/** List all topics belonging to the logged-in tutor. */
export async function getMyTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const topics = await Topic.find({ tutor: req.user!.userId }).sort({ createdAt: -1 });
    return res.json({ topics });
  } catch (err) {
    next(err);
  }
}

/** Get a single topic by id (also increments the view counter — feature #16). */
export async function getTopicById(req: Request, res: Response, next: NextFunction) {
  try {
    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate("tutor", "fullName department");
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    return res.json({ topic });
  } catch (err) {
    next(err);
  }
}