import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { embed, buildProfileText, generateProfileSummary } from "../services/llm.service.js";

const updateProfileSchema = z.object({
  degree: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  year: z.number().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.string().optional(),
  workStyle: z.string().optional(),
});

/**
 * Update the logged-in student's profile, then:
 *   1. Assemble the profile into text
 *   2. Embed it (feature #33)
 *   3. Generate an AI summary (feature #03)
 * Both the embedding and the summary are saved on the user document.
 *
 * Note: we use two separate findByIdAndUpdate calls instead of fetch->mutate->save()
 * to avoid Mongoose version-key conflicts on documents that were bulk-inserted
 * (e.g. by the seed script).
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(req.user!.userId, data, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    const profileText = buildProfileText({
      skills: user.skills,
      interests: user.interests,
      workStyle: user.workStyle,
      degree: user.degree?.toString(),
    });

    let updatedUser = user;

    if (profileText.trim().length > 0) {
      const [embedding, aiSummary] = await Promise.all([
        embed(profileText),
        generateProfileSummary(profileText),
      ]);

      const withAi = await User.findByIdAndUpdate(
        req.user!.userId,
        { embedding, aiSummary },
        { new: true }
      );
      if (withAi) updatedUser = withAi;
    }

    return res.json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
}