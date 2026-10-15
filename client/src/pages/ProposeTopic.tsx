import { useEffect, useState } from "react";
import api from "../lib/api";
import SimilarTopicsNotice from "../components/SimilarTopicsNotice";

interface TutorOption {
  _id: string;
  fullName: string;
  department: string;
}

interface Suggestion {
  tutorId: string;
  fullName: string;
  department: string;
  areas: string[];
  score: number;
  source: "profile" | "topic";
  topicTitle?: string;
  atCapacity: boolean;
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

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [unranked, setUnranked] = useState(0);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");

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

  // AI tutor suggestions: wait until the student stops typing, then ask the
  // backend. The cancelled flag makes sure an old, slower response can never
  // overwrite a newer one. A failure shows a short note; the form itself
  // keeps working without suggestions.
  useEffect(() => {
    if (title.trim().length < 5 || description.trim().length < 20) {
      setSuggestions([]);
      setUnranked(0);
      setSuggestError("");
      setSuggesting(false);
      return;
    }

    let cancelled = false;
    setSuggesting(true);
    setSuggestError("");

    const timer = setTimeout(() => {
      api
        .post<{ suggestions: Suggestion[]; unranked: number }>("/suggestions/tutors", {
          title,
          description,
        })
        .then((res) => {
          if (cancelled) return;
          setSuggestions(res.data.suggestions);
          setUnranked(res.data.unranked);
        })
        .catch((err) => {
          if (cancelled) return;
          setSuggestions([]);
          setUnranked(0);
          setSuggestError(
            err?.response?.status === 503
              ? "Las sugerencias de IA no están disponibles ahora mismo. Puedes elegir tutor manualmente."
              : "No se pudieron cargar las sugerencias. Puedes elegir tutor manualmente."
          );
        })
        .finally(() => {
          if (!cancelled) setSuggesting(false);
        });
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [title, description]);

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
      <div className="flex items-center justify-center px-4 py-20">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center">
          <div className="text-2xl mb-2">📨</div>
          <div className="text-sm font-medium text-slate-800">Propuesta enviada</div>
          <div className="text-xs text-slate-500 mt-2">
            El tutor la revisará y te llegará una notificación con su decisión.
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

  const showSuggestions = suggesting || suggestions.length > 0 || unranked > 0;

  return (
    <div className="px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Proponer un tema</h1>
          <p className="text-sm text-slate-500 mt-1">
            Envía tu propia idea de TFM/TFG a un tutor de tu titulación.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
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

          {suggestError && (
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {suggestError}
            </div>
          )}

          <SimilarTopicsNotice
            audience="student"
            title={title}
            description={description}
            showErrors={false}
          />

          {showSuggestions && (
            <div className="rounded-xl border border-brand-mid/40 bg-brand-light/50 p-4">
              <div className="text-xs font-semibold text-brand-dark mb-2">
                Tutores sugeridos por la IA
              </div>

              {suggesting && suggestions.length === 0 && (
                <div className="text-xs text-slate-500">Analizando tu propuesta…</div>
              )}

              <div className={`space-y-2 transition-opacity ${suggesting ? "opacity-60" : ""}`}>
                {suggestions.slice(0, 3).map((s) => (
                  <div
                    key={s.tutorId}
                    className="flex items-center justify-between gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-slate-900 truncate">{s.fullName}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {s.source === "topic" && s.topicTitle
                          ? `Por su tema «${s.topicTitle}»`
                          : "Por su perfil de especialidad"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-dark text-white">
                        {s.score}%
                      </span>
                      {s.atCapacity ? (
                        <span className="text-[11px] text-slate-400">Completo</span>
                      ) : tutorId === s.tutorId ? (
                        <span className="text-[11px] text-emerald-700">Seleccionado</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTutorId(s.tutorId)}
                          className="text-[11px] px-2.5 py-1 rounded-md border border-brand text-brand hover:bg-brand-light transition"
                        >
                          Elegir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {unranked > 0 && (
                <div className="text-[11px] text-slate-400 mt-2">
                  {unranked} tutor(es) de tu titulación todavía no tienen perfil ni temas publicados,
                  así que no se han podido valorar.
                </div>
              )}
            </div>
          )}

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
            <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
            <div className="flex gap-2">
              {(["TFM", "TFG"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`text-xs px-4 py-2 rounded-lg border ${
                    type === t
                      ? "bg-brand-dark text-white border-brand-dark"
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
            className="w-full text-xs px-4 py-2.5 rounded-lg bg-brand-dark text-white font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {submitting ? "Enviando…" : "Enviar propuesta"}
          </button>
        </form>
      </div>
    </div>
  );
}