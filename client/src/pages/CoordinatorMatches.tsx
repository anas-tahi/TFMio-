import { useEffect, useState } from "react";
import api from "../lib/api";

interface StudentRef {
  fullName: string;
  email: string;
}

interface TutorRef {
  fullName: string;
}

interface TopicRef {
  title: string;
}

interface WorkItem {
  _id: string;
  student: StudentRef;
  tutor: TutorRef;
  topic: TopicRef;
  coordinatorDecision: "pending" | "approved" | "rejected" | "not_reviewed";
}

export default function CoordinatorMatches() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState<Record<string, boolean>>({});

  function load() {
    setLoading(true);
    api
      .get<{ works: WorkItem[] }>("/coordinator/matches")
      .then((res) => setItems(res.data.works))
      .catch(() => setError("No se pudieron cargar los emparejamientos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, decision: "approved" | "rejected" | "not_reviewed") {
    setDeciding((s) => ({ ...s, [id]: true }));
    try {
      await api.patch(`/coordinator/matches/${id}/decision`, { decision });
      setItems((prev) => prev.filter((w) => w._id !== id));
    } catch {
      alert("No se pudo procesar la decisión");
    } finally {
      setDeciding((s) => ({ ...s, [id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Emparejamientos pendientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Revisa los emparejamientos de tu titulación. Puedes aprobar, rechazar o no intervenir.
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">
            No hay emparejamientos pendientes de revisión.
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="text-sm font-medium text-slate-900">{item.student.fullName}</div>
              <div className="text-xs text-slate-500">{item.student.email}</div>

              <div className="text-xs text-slate-500 mt-2">
                Tema: <span className="text-slate-700">{item.topic.title}</span>
              </div>
              <div className="text-xs text-slate-500">
                Tutor: <span className="text-slate-700">{item.tutor.fullName}</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => decide(item._id, "approved")}
                  disabled={deciding[item._id]}
                  className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => decide(item._id, "rejected")}
                  disabled={deciding[item._id]}
                  className="text-xs px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => decide(item._id, "not_reviewed")}
                  disabled={deciding[item._id]}
                  className="text-xs px-4 py-2 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  No intervenir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}