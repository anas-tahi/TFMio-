import { useEffect, useState } from "react";
import api from "../lib/api";

interface Degree {
  matchingDeadline?: string;
  submissionDeadline?: string;
  presentationPeriodStart?: string;
  presentationPeriodEnd?: string;
}

function toInputDate(iso?: string) {
  if (!iso) return "";
  return iso.slice(0, 10); // yyyy-mm-dd for <input type="date">
}

export default function CoordinatorCalendar() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [matchingDeadline, setMatchingDeadline] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [presentationPeriodStart, setPresentationPeriodStart] = useState("");
  const [presentationPeriodEnd, setPresentationPeriodEnd] = useState("");

  useEffect(() => {
    api
      .get<{ degree: Degree }>("/degrees/calendar/mine")
      .then((res) => {
        const d = res.data.degree;
        setMatchingDeadline(toInputDate(d.matchingDeadline));
        setSubmissionDeadline(toInputDate(d.submissionDeadline));
        setPresentationPeriodStart(toInputDate(d.presentationPeriodStart));
        setPresentationPeriodEnd(toInputDate(d.presentationPeriodEnd));
      })
      .catch(() => setError("No se pudo cargar el calendario"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.patch("/degrees/calendar/mine", {
        matchingDeadline: matchingDeadline || null,
        submissionDeadline: submissionDeadline || null,
        presentationPeriodStart: presentationPeriodStart || null,
        presentationPeriodEnd: presentationPeriodEnd || null,
      });
      setSaved(true);
    } catch {
      alert("No se pudo guardar el calendario");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadReport() {
    const res = await api.get("/reports/assignments", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "asignaciones-tfm.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Calendario académico</h1>
          <p className="text-sm text-slate-500 mt-1">
            Define los plazos para tu titulación. Una vez pasado el plazo de elección,
            los estudiantes ya no podrán enviar nuevas solicitudes.
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && (
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Plazo para elegir tutor/tema
              </label>
              <input
                type="date"
                value={matchingDeadline}
                onChange={(e) => setMatchingDeadline(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Plazo de entrega de la memoria
              </label>
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Inicio de presentaciones
                </label>
                <input
                  type="date"
                  value={presentationPeriodStart}
                  onChange={(e) => setPresentationPeriodStart(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Fin de presentaciones
                </label>
                <input
                  type="date"
                  value={presentationPeriodEnd}
                  onChange={(e) => setPresentationPeriodEnd(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {saved && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Calendario guardado correctamente
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full text-xs px-4 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar calendario"}
            </button>
          </form>
        )}

        <button
          onClick={handleDownloadReport}
          className="w-full mt-4 text-xs px-4 py-2.5 rounded-lg border border-brand text-brand font-medium hover:bg-brand-light transition"
        >
          Descargar informe de asignaciones (PDF)
        </button>
      </div>
    </div>
  );
}