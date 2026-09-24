import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";

interface Criterion {
  name: string;
  maxPoints: number;
  weight: number;
}

interface Rubric {
  criteria: Criterion[];
}

export default function GradeWork() {
  const { workId } = useParams<{ workId: string }>();

  const [role, setRole] = useState<"tutor" | "jury" | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: ask the backend which role THIS specific user has for THIS
  // specific work — never guess from the account's general role, since a
  // tutor account can also be a jury member on someone else's defense.
  useEffect(() => {
    if (!workId) return;
    let cancelled = false;
    api
      .get<{ role: "tutor" | "jury" }>(`/grades/${workId}/my-role`)
      .then((res) => {
        if (!cancelled) setRole(res.data.role);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || "No autorizado para calificar este trabajo");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workId]);

  // Step 2: once we know the confirmed role, fetch the matching rubric.
  useEffect(() => {
    if (!workId || !role) return;
    let cancelled = false;
    setLoading(true);

    api
      .get<{ rubric: Rubric }>(`/grades/${workId}/rubric/${role}`)
      .then((res) => {
        if (!cancelled) setRubric(res.data.rubric);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || "No se pudo cargar la rúbrica");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workId, role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rubric) return;

    const scoreArray = rubric.criteria.map((c) => ({
      name: c.name,
      points: scores[c.name] ?? 0,
    }));

    setSubmitting(true);
    try {
      await api.post(`/grades/${workId}`, { scores: scoreArray });
      setSubmitted(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo enviar la calificación");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-sm font-medium text-slate-800">Calificación enviada</div>
          <div className="text-xs text-slate-500 mt-2">
            En cuanto todos los evaluadores hayan calificado, se calculará la nota final.
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
          <h1 className="text-lg font-semibold text-slate-900">Calificar trabajo</h1>
          <p className="text-sm text-slate-500 mt-1">
            {role ? `Evaluación como ${role === "tutor" ? "tutor" : "miembro del tribunal"}.` : ""}
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && rubric && (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            {rubric.criteria.map((c) => (
              <div key={c.name}>
                <label className="text-xs text-slate-600 mb-1 block">
                  {c.name} <span className="text-slate-400">(máx. {c.maxPoints})</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={c.maxPoints}
                  step="0.1"
                  value={scores[c.name] ?? ""}
                  onChange={(e) =>
                    setScores((s) => ({ ...s, [c.name]: Number(e.target.value) }))
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-xs px-4 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Enviar calificación"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}