import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { embed } from "../services/llm.service.js";
import { buildTutorProfileText } from "../utils/profileText.js";

const updateTutorProfileSchema = z.object({
  bio: z.string().max(1500).optional(),
  areas: z.array(z.string().min(1).max(60)).max(12).optional(),
});

/** Tutor: read their own profile (bio and areas of expertise). */
export async function getTutorProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const tutor = await User.findById(req.user!.userId).select("bio areas department");
    if (!tutor) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json({
      bio: tutor.bio ?? "",
      areas: tutor.areas ?? [],
      department: tutor.department ?? "",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Tutor: save bio and areas of expertise, then embed the profile text so the
 * tutor can be ranked against proposals and topics. Two separate updates, as
 * in the student profile, to avoid Mongoose version-key conflicts. If the
 * embedding fails (for example Ollama is not running) the profile is still
 * saved, and `aiIndexed: false` tells the frontend.
 */
export async function updateTutorProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateTutorProfileSchema.parse(req.body);

    const tutor = await User.findByIdAndUpdate(req.user!.userId, data, { new: true });
    if (!tutor) return res.status(404).json({ message: "Usuario no encontrado" });

    const profileText = buildTutorProfileText({
      department: tutor.department,
      areas: tutor.areas,
      bio: tutor.bio,
    });

    let aiIndexed = false;
    if (profileText.trim().length > 0) {
      try {
        const embedding = await embed(profileText);
        await User.findByIdAndUpdate(req.user!.userId, { embedding });
        aiIndexed = true;
      } catch (err) {
        console.warn("Tutor profile saved, but the embedding failed:", err);
      }
    }

    return res.json({
      bio: tutor.bio ?? "",
      areas: tutor.areas ?? [],
      aiIndexed,
    });
  } catch (err) {
    next(err);
  }
}