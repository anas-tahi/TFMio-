import { Request, Response, NextFunction } from "express";
import { Work } from "../models/Work.js";
import { User } from "../models/User.js";
import { WorkStage, NotificationType } from "../types/index.js";
import { notify } from "../services/notification.service.js";
import { gradeLabel } from "../utils/gradeStatus.js";

/** Coordinator: every graded work in their degree, released or not. */
export async function getGradesToRelease(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const works = await Work.find({ stage: WorkStage.GRADED })
      .populate({
        path: "student",
        match: { degree: coordinator.degreeManaged },
        select: "fullName email",
      })
      .populate("tutor", "fullName")
      .populate("topic", "title")
      .sort({ "grade.gradedAt": -1 })
      .lean();

    const result = works
      .filter((w) => w.student !== null)
      .map((w) => ({
        ...w,
        gradeLabel:
          w.grade?.finalGrade !== undefined ? gradeLabel(w.grade.finalGrade) : null,
      }));

    return res.json({ works: result });
  } catch (err) {
    next(err);
  }
}

/** Coordinator: publish a final grade so the student can see it. */
export async function publishGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId } = req.params;

    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const work = await Work.findById(workId)
      .populate("student", "fullName degree")
      .populate("topic", "title");
    if (!work) return res.status(404).json({ message: "No encontrado" });

    const student = work.student as unknown as {
      _id: string;
      fullName: string;
      degree?: { toString(): string };
    };

    if (!student.degree || student.degree.toString() !== coordinator.degreeManaged.toString()) {
      return res.status(403).json({ message: "Este trabajo no pertenece a tu titulación" });
    }
    if (work.stage !== WorkStage.GRADED || work.grade?.finalGrade === undefined) {
      return res.status(409).json({ message: "Este trabajo aún no tiene nota final" });
    }
    if (work.grade.released) {
      return res.status(409).json({ message: "La nota ya está publicada" });
    }

    const finalGrade = work.grade.finalGrade;

    await Work.findByIdAndUpdate(workId, {
      "grade.released": true,
      "grade.releasedAt": new Date(),
    });

    await notify({
      recipient: student._id,
      type: NotificationType.GRADE,
      title: "Calificación final publicada",
      message: `Tu nota final es ${finalGrade.toFixed(2)} / 10 — ${gradeLabel(finalGrade)}.`,
      link: "/my-works",
    });

    return res.json({ released: true, finalGrade, label: gradeLabel(finalGrade) });
  } catch (err) {
    next(err);
  }
}