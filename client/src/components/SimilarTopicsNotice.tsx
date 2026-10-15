import { useEffect, useState } from "react";
import api from "../lib/api";

interface SimilarTopic {
  topicId: string;
  title: string;
  tutorName: string;
  type: "TFM" | "TFG";
  score: number;
  isOwn: boolean;
}

interface Props {
  title: string;
  description: string;
  skills?: string[];
  audience: "student" | "tutor";
  /** Show a short note when the check can't run (for example the AI service is down). */
  showErrors?: boolean;
  className?: string;
}

/**
 * Soft notice listing already-published topics that look similar to the text
 * being written. It waits until the user stops typing, never blocks anything,
 * and stays hidden when nothing is similar.
 */
export default function SimilarTopicsNotice({
  title,
  description,
  skills,
  audience,
  showErrors = true,
  className = "",
}: Props) {
  const [similar, setSimilar] = useState<SimilarTopic[]>([]);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  const skillsKey = (skills ?? []).join("|");

  useEffect(() => {
    if (title.trim().length < 5 || description.trim().length < 20) {
      setSimilar([]);
      setFailed(false);
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    setFailed(false);

    const timer = setTimeout(() => {
      api
        .post<{ similar: SimilarTopic[] }>("/suggestions/similar-topics", {
          title,
          description,
          skills: skillsKey ? skillsKey.split("|") : [],
        })
        .then((res) => {
          if (!cancelled) setSimilar(res.data.similar);
        })
        .catch(() => {
          if (!cancelled) {
            setSimilar([]);
            setFailed(true);
          }
        })
        .finally(() => {
          if (!cancelled) setChecking(false);
        });
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [title, description, skillsKey]);

  if (failed && showErrors) {
    return (
      <div
        className={`text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 ${className}`}
      >
        No se pudo comprobar ahora mismo si ya existen temas parecidos.
      </div>
    );
  }

  if (similar.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50/60 p-4 animate-fade-in ${className}`}
    >
      <div className="text-xs font-semibold text-amber-900 mb-1">
        Ya hay temas parecidos publicados
      </div>
      <p className="text-[11px] text-amber-800 mb-3">
        {audience === "student"
          ? "Antes de enviar tu propuesta, mira si alguno ya cubre tu idea. Los encontrarás en Recomendaciones."
          : "Revisa que no estés duplicando un tema que ya existe en tu titulación."}
      </p>

      <div className={`space-y-2 transition-opacity ${checking ? "opacity-60" : ""}`}>
        {similar.map((s) => (
          <div
            key={s.topicId}
            className="flex items-center justify-between gap-3 bg-white rounded-lg border border-amber-100 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="text-sm text-slate-900 truncate">{s.title}</div>
              <div className="text-[11px] text-slate-500 truncate">
                {s.isOwn ? "Tuyo" : s.tutorName} · {s.type}
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-dark text-white flex-shrink-0">
              {s.score}%
            </span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-amber-800/80 mt-2">
        La similitud es orientativa: la calcula un modelo de IA y puede equivocarse.
      </div>
    </div>
  );
}