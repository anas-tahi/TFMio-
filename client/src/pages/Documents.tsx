import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../store/auth";

type DocType = "proposal" | "progress_report" | "memory";

interface DocumentItem {
  _id: string;
  type: DocType;
  fileName: string;
  status: "submitted" | "approved" | "revision_requested";
  aiSummary?: string;
  aiMissingSections?: string[];
  reviewNote?: string;
  createdAt: string;
}

const typeLabels: Record<DocType, string> = {
  proposal: "Propuesta",
  progress_report: "Informe de progreso",
  memory: "Memoria final",
};
const statusLabels: Record<string, string> = {
  submitted: "Enviado, pendiente de revisión",
  approved: "Aprobado",
  revision_requested: "Cambios solicitados",
};
const statusColors: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-600",
  approved: "bg-emerald-50 text-emerald-700",
  revision_requested: "bg-amber-50 text-amber-700",
};

export default function Documents() {
  const { workId } = useParams<{ workId: string }>();
  const user = useAuth((s) => s.user);
  const isTutor = user?.role === "tutor";

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [docType, setDocType] = useState<DocType>("proposal");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<Record<string, boolean>>({});

  function load() {
    setLoading(true);
    api
      .get<{ documents: DocumentItem[] }>(`/documents/${workId}`)
      .then((res) => setDocs(res.data.documents))
      .catch(() => setError("No se pudieron cargar los documentos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [workId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      alert("Selecciona un archivo PDF");
      return;
    }
    if (file.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF");
      return;
    }

    const formData = new FormData();
    formData.append("type", docType);
    formData.append("file", file);

    setSubmitting(true);
    try {
      await api.post(`/documents/${workId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo enviar el documento");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(id: string, fileName: string) {
    const res = await api.get(`/documents/file/${id}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleReview(id: string, decision: "approve" | "request_revision") {
    const note = reviewNote[id]?.trim();
    if (decision === "request_revision" && !note) {
      alert("Escribe qué cambios pides");
      return;
    }
    setReviewing((s) => ({ ...s, [id]: true }));
    try {
      await api.patch(`/documents/${id}/review`, { decision, note: note || undefined });
      load();
    } catch {
      alert("No se pudo procesar la revisión");
    } finally {
      setReviewing((s) => ({ ...s, [id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Documentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isTutor
              ? "Revisa los documentos entregados, con ayuda de la IA."
              : "Sube tu propuesta, informes de progreso y memoria final en PDF."}
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {!isTutor && (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tipo de documento</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="proposal">Propuesta</option>
                <option value="progress_report">Informe de progreso</option>
                <option value="memory">Memoria final</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Archivo PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 file:mr-3 file:text-xs file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-brand-light file:text-brand-dark"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="text-xs px-4 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60"
            >
              {submitting ? "Analizando y enviando…" : "Entregar documento"}
            </button>
          </form>
        )}

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && docs.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">
            Aún no se ha entregado ningún documento.
          </div>
        )}

        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc._id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-900">{typeLabels[doc.type]}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[doc.status]}`}>
                  {statusLabels[doc.status]}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {new Date(doc.createdAt).toLocaleDateString("es-ES")}
              </div>

              <button
                onClick={() => handleDownload(doc._id, doc.fileName)}
                className="text-xs text-brand font-medium mt-2 flex items-center gap-1"
              >
                📄 {doc.fileName}
              </button>

              {doc.aiSummary && (
                <div className="mt-3 text-xs bg-brand-light text-brand-dark rounded-lg px-3 py-2 leading-relaxed">
                  <strong>Resumen IA:</strong> {doc.aiSummary}
                </div>
              )}
              {doc.aiMissingSections && doc.aiMissingSections.length > 0 && (
                <div className="mt-2 text-xs bg-amber-50 text-amber-800 rounded-lg px-3 py-2 leading-relaxed">
                  <strong>Secciones que faltan (IA):</strong> {doc.aiMissingSections.join(", ")}
                </div>
              )}
              {doc.reviewNote && (
                <div className="mt-2 text-xs bg-slate-50 text-slate-700 rounded-lg px-3 py-2 leading-relaxed border border-slate-100">
                  <strong>Nota del tutor:</strong> {doc.reviewNote}
                </div>
              )}

              {isTutor && doc.status === "submitted" && (
                <div className="mt-4 space-y-2">
                  <textarea
                    value={reviewNote[doc._id] || ""}
                    onChange={(e) => setReviewNote((s) => ({ ...s, [doc._id]: e.target.value }))}
                    placeholder="Nota opcional (obligatoria si pides cambios)…"
                    rows={2}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(doc._id, "approve")}
                      disabled={reviewing[doc._id]}
                      className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReview(doc._id, "request_revision")}
                      disabled={reviewing[doc._id]}
                      className="text-xs px-4 py-2 rounded-lg border border-amber-400 text-amber-600 hover:bg-amber-50 transition disabled:opacity-60"
                    >
                      Solicitar cambios
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}