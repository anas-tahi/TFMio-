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

interface RubricResponse {
  rubric: Rubric;
  maxNotEvaluated: number;
}

interface ScorePayload {
  name: string;
  points?: number;
  notEvaluated?: boolean;
}

export default function GradeWork() {
  const { workId } = useParams<{ workId: string }>();

  const [role, setRole] = useState<"tutor" | "jury" | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [maxNotEvaluated, setMaxNotEvaluated] = useState(0);
  // Typed values are kept as text, so an empty box is different from a real 0.
  const [scores, setScores] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Separate from `error`: this is the clear message for a work the
  // coordinator already closed, shown instead of the form.
  const [closedMessage, setClosedMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const skippedCount = Object.values(skipped).filter(Boolean).length;

  // Step 1: ask the backend which role THIS user has for THIS work.
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

  // Step 2: once the role is known, load the matching rubric and the skip limit.
  // A 409 here means the work is no longer waiting for grades (for example,
  // the coordinator already closed it with the grades received).
  useEffect(() => {
    if (!workId || !role) return;
    let cancelled = false;
    setLoading(true);

    api
      .get<RubricResponse>(`/grades/${workId}/rubric/${role}`)
      .then((res) => {
        if (cancelled) return;
        setRubric(res.data.rubric);
        setMaxNotEvaluated(res.data.maxNotEvaluated ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 409) {
          setClosedMessage(
            "La coordinación ya ha cerrado la calificación de este trabajo con las notas recibidas."
          );
        } else {
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

  function toggleSkipped(name: string) {
    setFormError("");
    setSkipped((s) => ({ ...s, [name]: !s[name] }));
    setScores((s) => ({ ...s, [name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rubric) return;
    setFormError("");

    const payload: ScorePayload[] = [];
    for (const c of rubric.criteria) {
      if (skipped[c.name]) {
        payload.push({ name: c.name, notEvaluated: true });
        continue;
      }
      const raw = (scores[c.name] ?? "").trim();
      if (raw === "") {
        setFormError(`Falta la puntuación de «${c.name}»`);
        return;
      }
      const points = Number(raw);
      if (!Number.isFinite(points) || points < 0 || points > c.maxPoints) {
        setFormError(`La puntuación de «${c.name}» debe estar entre 0 y ${c.maxPoints}`);
        return;
      }
      payload.push({ name: c.name, points });
    }

    if (payload.every((p) => p.notEvaluated)) {
      setFormError("Debes evaluar al menos un criterio");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/grades/${workId}`, { scores: payload });
      setSubmitted(true);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setClosedMessage(
          "La coordinación ya ha cerrado la calificación de este trabajo con las notas recibidas."
        );
        setRubric(null);
      } else {
        setFormError(err?.response?.data?.message || "No se pudo enviar la calificación");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-sm font-medium text-slate-800">Calificación enviada</div>
          <div className="text-xs text-slate-500 mt-2">
            En cuanto todos los evaluadores hayan calificado, se calculará la nota final.
          </div>
          <a
            href="/"
            className="inline-block mt-4 text-xs px-4 py-2 rounded-lg bg-brand-dark text-white font-medium hover:opacity-90 transition"
          >
            Volver al panel
          </a>
        </div>
      </div>
    );
  }

  if (closedMessage) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center">
          <div className="text-2xl mb-2">🔒</div>
          <div className="text-sm font-medium text-slate-800">Calificación ya cerrada</div>
          <div className="text-xs text-slate-500 mt-2">{closedMessage}</div>
          <a
            href="/my-works"
            className="inline-block mt-4 text-xs px-4 py-2 rounded-lg bg-brand-dark text-white font-medium hover:opacity-90 transition"
          >
            Volver a mis trabajos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Calificar trabajo</h1>
          <p className="text-sm text-slate-500 mt-1">
            {role ? `Evaluación como ${role === "tutor" ? "tutor" : "miembro del tribunal"}.` : ""}
          </p>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && rubric && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
          >
            {maxNotEvaluated > 0 && (
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                Puedes dejar sin evaluar hasta {maxNotEvaluated} criterios ({skippedCount}/
                {maxNotEvaluated}). La nota se calcula solo con los criterios evaluados.
              </div>
            )}

            {rubric.criteria.map((c) => {
              const isSkipped = Boolean(skipped[c.name]);
              const limitReached = skippedCount >= maxNotEvaluated;
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <label className="text-xs text-slate-600">
                      {c.name} <span className="text-slate-400">(máx. {c.maxPoints})</span>
                    </label>
                    {maxNotEvaluated > 0 && (
                      <label
                        className={`flex items-center gap-1.5 text-xs ${
                          !isSkipped && limitReached
                            ? "text-slate-300"
                            : "text-slate-500 cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSkipped}
                          disabled={!isSkipped && limitReached}
                          onChange={() => toggleSkipped(c.name)}
                        />
                        No evaluado
                      </label>
                    )}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={c.maxPoints}
                    step="0.1"
                    value={scores[c.name] ?? ""}
                    disabled={isSkipped}
                    onChange={(e) => {
                      setFormError("");
                      setScores((s) => ({ ...s, [c.name]: e.target.value }));
                    }}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              );
            })}

            {formError && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-xs px-4 py-2.5 rounded-lg bg-brand-dark text-white font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Enviar calificación"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}