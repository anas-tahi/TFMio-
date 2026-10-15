import { useEffect, useState } from "react";
import api from "../lib/api";

interface GradedWork {
  _id: string;
  student: { fullName: string; email: string };
  tutor: { fullName: string };
  topic: { title: string };
  grade?: { finalGrade?: number; released?: boolean; releasedAt?: string };
  gradeLabel: "Aprobado" | "Suspenso" | null;
}

export default function CoordinatorGrades() {
  const [works, setWorks] = useState<GradedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api
      .get<{ works: GradedWork[] }>("/grade-release")
      .then((res) => setWorks(res.data.works))
      .catch(() => setError("No se pudieron cargar las calificaciones"))
      .finally(() => setLoading(false));
  }, []);

  async function handlePublish(workId: string) {
    setPublishing((s) => ({ ...s, [workId]: true }));
    try {
      await api.patch(`/grade-release/${workId}/publish`);
      setWorks((prev) =>
        prev.map((w) =>
          w._id === workId ? { ...w, grade: { ...w.grade, released: true } } : w
        )
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo publicar la nota");
    } finally {
      setPublishing((s) => ({ ...s, [workId]: false }));
    }
  }

  const pending = works.filter((w) => !w.grade?.released);
  const published = works.filter((w) => w.grade?.released);

  function renderCard(w: GradedWork) {
    const released = Boolean(w.grade?.released);
    const finalGrade = w.grade?.finalGrade;
    const passed = w.gradeLabel === "Aprobado";

    return (
      <div key={w._id} className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-900">{w.student.fullName}</div>
            <div className="text-xs text-slate-500">{w.student.email}</div>
          </div>
          {finalGrade !== undefined && (
            <div className="text-right">
              <div className="text-lg font-semibold text-slate-900">
                {finalGrade.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal"> / 10</span>
              </div>
              <span
                className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                  passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {w.gradeLabel}
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 mt-2">
          Tema: <span className="text-slate-700">{w.topic.title}</span> · Tutor:{" "}
          <span className="text-slate-700">{w.tutor.fullName}</span>
        </div>

        <div className="mt-4">
          {released ? (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 inline-block">
              Publicada
              {w.grade?.releasedAt
                ? ` el ${new Date(w.grade.releasedAt).toLocaleDateString("es-ES")}`
                : ""}
            </span>
          ) : (
            <button
              onClick={() => handlePublish(w._id)}
              disabled={publishing[w._id]}
              className="text-xs px-4 py-2 rounded-lg bg-brand-dark text-white font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {publishing[w._id] ? "Publicando…" : "Publicar nota"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Calificaciones</h1>
          <p className="text-sm text-slate-500 mt-1">
            Notas finales de tu titulación. El estudiante no ve su nota hasta que la publiques.
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
            Todavía no hay trabajos calificados en tu titulación.
          </div>
        )}

        {pending.length > 0 && (
          <>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Pendientes de publicar
            </h2>
            <div className="space-y-3 mb-8">{pending.map(renderCard)}</div>
          </>
        )}

        {published.length > 0 && (
          <>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Ya publicadas
            </h2>
            <div className="space-y-3">{published.map(renderCard)}</div>
          </>
        )}
      </div>
    </div>
  );
}