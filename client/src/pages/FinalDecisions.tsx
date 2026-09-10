import { useEffect, useState } from "react";
import api from "../lib/api";

interface StudentRef {
  fullName: string;
  email: string;
}

interface TopicRef {
  title: string;
}

interface WorkItem {
  _id: string;
  student: StudentRef;
  topic: TopicRef;
  coordinatorDecision: "approved" | "rejected" | "not_reviewed";
  coordinatorNote?: string;
}

const coordinatorLabels: Record<string, string> = {
  approved: "Aprobado por el coordinador",
  rejected: "Rechazado por el coordinador",
  not_reviewed: "El coordinador no intervino",
};
const coordinatorColors: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  not_reviewed: "bg-slate-100 text-slate-500",
};

export default function FinalDecisions() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  function load() {
    setLoading(true);
    api
      .get<{ works: WorkItem[] }>("/final-decisions")
      .then((res) => setItems(res.data.works))
      .catch(() => setError("No se pudieron cargar las decisiones pendientes"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, decision: "confirm" | "cancel") {
    setBusy((s) => ({ ...s, [id]: true }));
    try {
      await api.patch(`/final-decisions/${id}/decision`, { decision });
      setItems((prev) => prev.filter((w) => w._id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo procesar la decisión");
    } finally {
      setBusy((s) => ({ ...s, [id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Decisión final</h1>
          <p className="text-sm text-slate-500 mt-1">
            El coordinador ya dio su opinión. La decisión final es tuya.
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
            No tienes decisiones pendientes.
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

              <span
                className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-3 ${
                  coordinatorColors[item.coordinatorDecision]
                }`}
              >
                {coordinatorLabels[item.coordinatorDecision]}
              </span>

              {item.coordinatorNote && (
                <div className="mt-3 text-xs bg-slate-50 text-slate-700 rounded-lg px-3 py-2 leading-relaxed border border-slate-100">
                  <strong>Nota del coordinador:</strong> {item.coordinatorNote}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => decide(item._id, "confirm")}
                  disabled={busy[item._id]}
                  className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => decide(item._id, "cancel")}
                  disabled={busy[item._id]}
                  className="text-xs px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}