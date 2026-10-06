import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../store/auth";

interface WorkItem {
  _id: string;
  myRole: "student" | "tutor" | "jury";
  stage: string;
  student: { fullName: string; email: string };
  tutor: { fullName: string };
  topic: { title: string };
  defense?: { date?: string; time?: string; room?: string };
  grade?: { finalGrade?: number };
}

const stageLabels: Record<string, string> = {
  matched: "Emparejado",
  approved: "Aprobado",
  in_progress: "En progreso",
  defense_ready: "Listo para defensa",
  defended: "Defendido",
  graded: "Calificado",
};

const roleLabels: Record<string, string> = {
  student: "Estudiante",
  tutor: "Tutor",
  jury: "Tribunal",
};

const linkPrimary =
  "inline-block text-xs px-4 py-2 rounded-lg bg-brand-dark text-white font-medium hover:opacity-90 transition";
const linkSecondary =
  "inline-block text-xs px-4 py-2 rounded-lg border border-brand text-brand font-medium hover:bg-brand-light transition";

export default function MyWorks() {
  const user = useAuth((s) => s.user);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isStudent = user?.role === "student";

  useEffect(() => {
    api
      .get<{ works: WorkItem[] }>("/works/mine")
      .then((res) => setWorks(res.data.works))
      .catch(() => setError("No se pudieron cargar tus trabajos"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">
            {isStudent ? "Mi TFM" : "Mis trabajos"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isStudent
              ? "Tu trabajo, con acceso directo a documentos, mensajes y calificación."
              : "Todos los trabajos en los que participas, con acceso directo a documentos, mensajes y calificación."}
          </p>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && works.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">
            Todavía no participas en ningún trabajo. Aparecerá aquí en cuanto tengas un tema asignado.
          </div>
        )}

        <div className="space-y-3">
          {works.map((w) => {
            const canOpenDocs = w.myRole === "student" || w.myRole === "tutor";
            const canChat = w.myRole === "student" || w.myRole === "tutor";
            const canGrade =
              (w.myRole === "tutor" || w.myRole === "jury") &&
              (w.stage === "defense_ready" || w.stage === "defended");

            return (
              <div key={w._id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-medium text-slate-900">{w.topic.title}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-light text-brand-dark font-medium whitespace-nowrap">
                    {roleLabels[w.myRole]}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-2">
                  Estudiante: <span className="text-slate-700">{w.student.fullName}</span> · Tutor:{" "}
                  <span className="text-slate-700">{w.tutor.fullName}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {stageLabels[w.stage] ?? w.stage}
                  </span>
                  {w.defense?.date && (
                    <span className="text-xs text-slate-500">
                      Defensa: {new Date(w.defense.date).toLocaleDateString("es-ES")}
                      {w.defense.time ? ` · ${w.defense.time}` : ""}
                      {w.defense.room ? ` · ${w.defense.room}` : ""}
                    </span>
                  )}
                </div>

                {w.stage === "graded" && w.grade?.finalGrade !== undefined && w.myRole === "student" && (
                  <div className="mt-3 text-sm bg-brand-light text-brand-dark rounded-lg px-3 py-2">
                    Nota final: <strong>{w.grade.finalGrade.toFixed(2)} / 10</strong>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {canOpenDocs && (
                    <a href={`/works/${w._id}/documents`} className={linkPrimary}>
                      Documentos
                    </a>
                  )}
                  {canChat && (
                    <a href={`/chat/${w._id}`} className={linkSecondary}>
                      Mensajes
                    </a>
                  )}
                  {canGrade && (
                    <a href={`/works/${w._id}/grade`} className={linkPrimary}>
                      Calificar
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}