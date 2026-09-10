import { Request, Response, NextFunction } from "express";
import { Degree } from "../models/Degree.js";
import { User } from "../models/User.js";

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

    const { matchingDeadline, submissionDeadline, presentationPeriodStart, presentationPeriodEnd } =
      req.body as {
        matchingDeadline?: string;
        submissionDeadline?: string;
        presentationPeriodStart?: string;
        presentationPeriodEnd?: string;
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
      },
      { new: true }
    );

    return res.json({ degree });
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
    return res.json({ degree });
  } catch (err) {
    next(err);
  }
}