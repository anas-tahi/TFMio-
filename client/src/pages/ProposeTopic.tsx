import { useEffect, useState } from "react";
import api from "../lib/api";

interface TutorOption {
  _id: string;
  fullName: string;
  department: string;
}

export default function ProposeTopic() {
  const [tutors, setTutors] = useState<TutorOption[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [tutorId, setTutorId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"TFM" | "TFG">("TFM");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ tutors: TutorOption[] }>("/students/tutors")
      .then((res) => setTutors(res.data.tutors))
      .catch((err) => {
        const msg = err?.response?.data?.message || "No se pudieron cargar los tutores";
        setLoadError(msg);
      })
      .finally(() => setLoadingTutors(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tutorId || title.trim().length < 5 || description.trim().length < 20) {
      setError("Completa todos los campos (título de al menos 5 caracteres, descripción de al menos 20)");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/proposals", { tutorId, title, description, type });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo enviar la propuesta");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center">
          <div className="text-2xl mb-2">📨</div>
          <div className="text-sm font-medium text-slate-800">Propuesta enviada</div>
          <div className="text-xs text-slate-500 mt-2">
            El tutor la revisará y te llegará una notificación con su decisión.
          </div>
          <a
            href="/"
            className="inline-block mt-4 text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition"
          >
            Volver al panel
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Proponer un tema</h1>
          <p className="text-sm text-slate-500 mt-1">
            Envía tu propia idea de TFM/TFG a un tutor de tu titulación.
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          {loadingTutors && <div className="text-xs text-slate-500">Cargando tutores…</div>}
          {loadError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {loadError}
            </div>
          )}

          {!loadingTutors && !loadError && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tutor</label>
              <select
                value={tutorId}
                onChange={(e) => setTutorId(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="">Selecciona un tutor…</option>
                {tutors.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.fullName} — {t.department}
                  </option>
                ))}
              </select>
              {tutors.length === 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  No hay tutores disponibles en tu titulación todavía.
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Título de tu propuesta de tema"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Explica de qué trata tu idea, qué te gustaría investigar o desarrollar"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
            <div className="flex gap-2">
              {(["TFM", "TFG"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`text-xs px-4 py-2 rounded-lg border ${
                    type === t
                      ? "bg-brand text-white border-brand"
                      : "border-slate-300 text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-xs px-4 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60"
          >
            {submitting ? "Enviando…" : "Enviar propuesta"}
          </button>
        </form>
      </div>
    </div>
  );
}