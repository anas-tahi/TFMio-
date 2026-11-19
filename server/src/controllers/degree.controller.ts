import { Request, Response, NextFunction } from "express";
import { Degree, IDegree } from "../models/Degree.js";
import { User } from "../models/User.js";
import { normalizeGradingDays } from "../utils/gradingDeadline.js";

/** A degree as the frontend sees it: gradingDays always has a usable value. */
function withGradingDays(degree: IDegree) {
  return { ...degree.toObject(), gradingDays: normalizeGradingDays(degree.gradingDays) };
}

/** List all degrees (titulaciones) — used to populate dropdowns in forms. */
export async function getDegrees(_req: Request, res: Response, next: NextFunction) {
  try {
    const degrees = await Degree.find().sort({ name: 1 });
    return res.json({ degrees });
  } catch (err) {
    next(err);
  }
}

/** Coordinator: set the academic calendar (deadlines) for their own degree. */
export async function setCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const {
      matchingDeadline,
      submissionDeadline,
      presentationPeriodStart,
      presentationPeriodEnd,
      gradingDays,
    } = req.body as {
      matchingDeadline?: string;
      submissionDeadline?: string;
      presentationPeriodStart?: string;
      presentationPeriodEnd?: string;
      gradingDays?: number;
    };

    const degree = await Degree.findByIdAndUpdate(
      coordinator.degreeManaged,
      {
        ...(matchingDeadline !== undefined && { matchingDeadline: matchingDeadline || null }),
        ...(submissionDeadline !== undefined && { submissionDeadline: submissionDeadline || null }),
        ...(presentationPeriodStart !== undefined && {
          presentationPeriodStart: presentationPeriodStart || null,
        }),
        ...(presentationPeriodEnd !== undefined && {
          presentationPeriodEnd: presentationPeriodEnd || null,
        }),
        ...(gradingDays !== undefined && { gradingDays: normalizeGradingDays(gradingDays) }),
      },
      { new: true }
    );

    if (!degree) return res.status(404).json({ message: "Titulación no encontrada" });

    return res.json({ degree: withGradingDays(degree) });
  } catch (err) {
    next(err);
  }
}

/** Coordinator: get the current calendar for their own degree. */
export async function getMyCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const degree = await Degree.findById(coordinator.degreeManaged);
    if (!degree) return res.status(404).json({ message: "Titulación no encontrada" });

    return res.json({ degree: withGradingDays(degree) });
  } catch (err) {
    next(err);
  }
}