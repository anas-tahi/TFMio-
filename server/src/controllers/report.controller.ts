import { Request, Response, NextFunction } from "express";
import PDFDocument from "pdfkit";
import { Work } from "../models/Work.js";
import { User } from "../models/User.js";

/** Coordinator: generate a PDF listing every student-topic-tutor assignment in their degree. */
export async function generateAssignmentReport(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const works = await Work.find({})
      .populate({
        path: "student",
        match: { degree: coordinator.degreeManaged },
        select: "fullName email",
      })
      .populate("tutor", "fullName")
      .populate("topic", "title")
      .sort({ createdAt: 1 });

    const filtered = works.filter((w) => w.student !== null);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=asignaciones-tfm.pdf");
    doc.pipe(res);

    doc.fontSize(18).fillColor("#534AB7").text("TFMio — Informe de asignaciones", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666666").text(`Generado el ${new Date().toLocaleDateString("es-ES")}`);
    doc.moveDown(1.5);

    if (filtered.length === 0) {
      doc.fontSize(12).fillColor("#333333").text("No hay asignaciones registradas todavía.");
    }

    filtered.forEach((w, i) => {
      const student = w.student as unknown as { fullName: string; email: string };
      const tutor = w.tutor as unknown as { fullName: string };
      const topic = w.topic as unknown as { title: string };
      const presentationDate = w.defense?.date
        ? new Date(w.defense.date).toLocaleDateString("es-ES")
        : "Sin programar";

      doc.fontSize(11).fillColor("#111111").text(`${i + 1}. ${student.fullName}`, { continued: false });
      doc.fontSize(9).fillColor("#555555").text(`   Tema: ${topic.title}`);
      doc.text(`   Tutor: ${tutor.fullName}`);
      doc.text(`   Presentación: ${presentationDate}`);
      doc.moveDown(0.6);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}