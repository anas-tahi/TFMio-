import { Request, Response, NextFunction } from "express";
import { Work } from "../models/Work.js";
import { User } from "../models/User.js";

/** Tutor: full history of all their matches, regardless of stage. */
export async function getTutorHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const works = await Work.find({ tutor: req.user!.userId })
      .populate("student", "fullName email")
      .populate("topic", "title")
      .sort({ createdAt: -1 });

    return res.json({ works });
  } catch (err) {
    next(err);
  }
}

/** Coordinator: full history of all matches in their degree. */
export async function getCoordinatorHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const works = await Work.find({})
      .populate({
        path: "student",
        match: { degree: coordinator.degreeManaged },
        select: "fullName email degree",
      })
      .populate("tutor", "fullName")
      .populate("topic", "title")
      .sort({ createdAt: -1 });

    const filtered = works.filter((w) => w.student !== null);

    return res.json({ works: filtered });
  } catch (err) {
    next(err);
  }
}