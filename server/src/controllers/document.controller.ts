import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { SubmittedDocument } from "../models/SubmittedDocument.js";
import { Work } from "../models/Work.js";
import { analyzeDocument } from "../services/llm.service.js";
import { DocumentType, DocumentStatus, WorkStage, NotificationType } from "../types/index.js";
import { notify } from "../services/notification.service.js";

const REQUIRED_SECTIONS: Record<DocumentType, string[]> = {
  [DocumentType.PROPOSAL]: ["Introducción", "Objetivos", "Metodología", "Planificación"],
  [DocumentType.PROGRESS_REPORT]: ["Trabajo realizado", "Dificultades encontradas", "Próximos pasos"],
  [DocumentType.MEMORY]: [
    "Introducción",
    "Estado del arte",
    "Metodología",
    "Resultados",
    "Conclusiones",
    "Bibliografía",
  ],
};

/** Student: upload a PDF document (proposal, progress report, or final memory) for their match. */
export async function submitDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId } = req.params;
    const { type } = req.body as { type: DocumentType };
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Debes subir un archivo PDF" });
    }
    if (!Object.values(DocumentType).includes(type)) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ message: "Tipo de documento inválido" });
    }

    const work = await Work.findById(workId);
    if (!work) {
      fs.unlink(file.path, () => {});
      return res.status(404).json({ message: "No encontrado" });
    }
    if (work.student.toString() !== req.user!.userId) {
      fs.unlink(file.path, () => {});
      return res.status(403).json({ message: "No autorizado" });
    }

    // Extract text from the uploaded PDF for AI analysis.
    const buffer = fs.readFileSync(file.path);
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const extractedText = parsed.text;

    if (!extractedText || extractedText.trim().length < 50) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({
        message: "No se pudo extraer texto legible del PDF. Comprueba que no sea un escaneo de imagen.",
      });
    }

    const requiredSections = REQUIRED_SECTIONS[type];
    const { summary, missingSections } = await analyzeDocument(extractedText, requiredSections);

    const doc = await SubmittedDocument.create({
      work: workId,
      student: req.user!.userId,
      type,
      fileName: file.originalname,
      filePath: file.path,
      extractedText,
      status: DocumentStatus.SUBMITTED,
      aiSummary: summary,
      aiMissingSections: missingSections,
    });

    await notify({
      recipient: work.tutor,
      type: NotificationType.DOCUMENT,
      title: "Nuevo documento entregado",
      message: `Tu estudiante ha entregado un documento (${type}) para su revisión.`,
      link: `/works/${workId}/documents`,
    });

    // Don't send extractedText back to the client — it's large and not needed there.
    const docResponse = doc.toObject();
    delete (docResponse as unknown as Record<string, unknown>).extractedText;

    return res.status(201).json({ document: docResponse });
  } catch (err) {
    next(err);
  }
}

/** List every document submitted for a given match (student and tutor can both view). */
export async function getDocumentsForWork(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId } = req.params;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ message: "No encontrado" });

    const isParty =
      work.student.toString() === req.user!.userId || work.tutor.toString() === req.user!.userId;
    if (!isParty) return res.status(403).json({ message: "No autorizado" });

    const documents = await SubmittedDocument.find({ work: workId }).sort({ createdAt: -1 });
    return res.json({ documents });
  } catch (err) {
    next(err);
  }
}

/** Download the original PDF for a document (student and tutor on that match only). */
export async function downloadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const doc = await SubmittedDocument.findById(id).populate("work");
    if (!doc) return res.status(404).json({ message: "No encontrado" });

    const work = doc.work as unknown as { student: string; tutor: string };
    const isParty =
      work.student.toString() === req.user!.userId || work.tutor.toString() === req.user!.userId;
    if (!isParty) return res.status(403).json({ message: "No autorizado" });

    return res.download(path.resolve(doc.filePath), doc.fileName);
  } catch (err) {
    next(err);
  }
}

/** Tutor: approve a document, or request revision with a note. */
export async function reviewDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { decision, note } = req.body as { decision: "approve" | "request_revision"; note?: string };

    const doc = await SubmittedDocument.findById(id).populate("work");
    if (!doc) return res.status(404).json({ message: "No encontrado" });

    const work = doc.work as unknown as { _id: string; tutor: string; stage: WorkStage };
    if (work.tutor.toString() !== req.user!.userId) {
      return res.status(403).json({ message: "No autorizado" });
    }

    if (decision === "request_revision") {
      if (!note) return res.status(400).json({ message: "Debes indicar qué cambiar" });
      doc.status = DocumentStatus.REVISION_REQUESTED;
      doc.reviewNote = note;
      await doc.save();

      await notify({
        recipient: doc.student,
        type: NotificationType.DOCUMENT,
        title: "Revisión solicitada",
        message: `Tu tutor pide cambios en tu documento: "${note}"`,
        link: `/works/${work._id}/documents`,
      });

      return res.json({ document: doc });
    }

    // decision === "approve"
    doc.status = DocumentStatus.APPROVED;
    if (note) doc.reviewNote = note;
    await doc.save();

    // Approving the final memory moves the Work forward to defense-ready.
    if (doc.type === DocumentType.MEMORY) {
      await Work.findByIdAndUpdate(work._id, { stage: WorkStage.DEFENSE_READY });
    } else if (work.stage === WorkStage.APPROVED) {
      await Work.findByIdAndUpdate(work._id, { stage: WorkStage.IN_PROGRESS });
    }

    await notify({
      recipient: doc.student,
      type: NotificationType.DOCUMENT,
      title: "Documento aprobado",
      message:
        doc.type === DocumentType.MEMORY
          ? "¡Tu memoria final ha sido aprobada! Ya está lista para la defensa."
          : "Tu tutor ha aprobado tu documento.",
      link: "/",
    });

    return res.json({ document: doc });
  } catch (err) {
    next(err);
  }
}