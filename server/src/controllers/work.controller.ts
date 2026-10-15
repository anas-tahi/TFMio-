import { Request, Response, NextFunction } from "express";
import { Work } from "../models/Work.js";
import { gradeLabel } from "../utils/gradeStatus.js";

interface PopulatedRef {
  _id: { toString(): string };
}

/**
 * List every work the logged-in user is involved in, whether as the student,
 * as the assigned tutor, or as a jury member. Each work carries `myRole` so
 * the frontend knows which actions to show (documents, grading, chat...).
 *
 * A student never receives the final grade until the coordinator has
 * released it; tutor and jury members can always see it.
 */
export async function getMyWorks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const works = await Work.find({
      $or: [{ student: userId }, { tutor: userId }, { "defense.jury": userId }],
    })
      .populate("student", "fullName email")
      .populate("tutor", "fullName")
      .populate("topic", "title")
      .sort({ updatedAt: -1 })
      .lean();

    const result = works.map((w) => {
      const studentId = (w.student as unknown as PopulatedRef)._id.toString();
      const tutorId = (w.tutor as unknown as PopulatedRef)._id.toString();
      const myRole = studentId === userId ? "student" : tutorId === userId ? "tutor" : "jury";

      const gradeReleased = Boolean(w.grade?.released);
      const hideGrade = myRole === "student" && !gradeReleased;
      const grade = hideGrade ? { ...w.grade, finalGrade: undefined } : w.grade;

      const visibleGrade = grade?.finalGrade;
      const label = visibleGrade !== undefined ? gradeLabel(visibleGrade) : null;

      return { ...w, grade, gradeReleased, gradeLabel: label, myRole };
    });

    return res.json({ works: result });
  } catch (err) {
    next(err);
  }
}