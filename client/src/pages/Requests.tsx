import { useEffect, useState } from "react";
import api from "../lib/api";

interface StudentRef {
  fullName: string;
  email: string;
  skills?: string[];
  interests?: string;
}

interface TopicRef {
  title: string;
}

interface InterestItem {
  _id: string;
  student: StudentRef;
  topic: TopicRef;
  status: "pending" | "accepted" | "rejected";
  matchScore?: number;
  aiMatchSummary?: string;
  studentNote?: string;
}

export default function Requests() {
  const [items, setItems] = useState<InterestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState<Record<string, boolean>>({});

  function load() {
    setLoading(true);
    api
      .get<{ interests: InterestItem[] }>("/interests/mine")
      .then((res) => setItems(res.data.interests))
      .catch(() => setError("No se pudieron cargar las solicitudes"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, decision: "accept" | "reject") {
    setDeciding((s) => ({ ...s, [id]: true }));
    try {
      await api.patch(`/interests/${id}/decision`, { decision });
      load();
    } catch {
      alert("No se pudo procesar la decisión");
    } finally {
      setDeciding((s) => ({ ...s, [id]: false }));
    }
  }

  const pending = items.filter((i) => i.status === "pending");
  const decided = items.filter((i) => i.status !== "pending");

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Solicitudes de estudiantes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Estudiantes interesados en tus temas, con una explicación generada por IA.
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando solicitudes…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && pending.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center mb-6">
            No tienes solicitudes pendientes.
          </div>
        )}

        <div className="space-y-3 mb-8">
          {pending.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">{item.student.fullName}</div>
                  <div className="text-xs text-slate-500">{item.student.email}</div>
                </div>
                {item.matchScore !== undefined && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand text-white">
                    {item.matchScore}% afinidad
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 mt-1">
                Interesado en: <span className="text-slate-700">{item.topic.title}</span>
              </div>

              {item.aiMatchSummary && (
                <div className="mt-3 text-xs bg-brand-light text-brand-dark rounded-lg px-3 py-2 leading-relaxed">
                  <strong>Por qué encaja (IA):</strong> {item.aiMatchSummary}
                </div>
              )}

              {item.studentNote && (
                <div className="mt-2 text-xs text-slate-600 italic">"{item.studentNote}"</div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => decide(item._id, "accept")}
                  disabled={deciding[item._id]}
                  className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => decide(item._id, "reject")}
                  disabled={deciding[item._id]}
                  className="text-xs px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>

        {decided.length > 0 && (
          <>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Ya procesadas
            </h2>
            <div className="space-y-2">
              {decided.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm text-slate-800">{item.student.fullName}</div>
                    <div className="text-xs text-slate-500">{item.topic.title}</div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      item.status === "accepted"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.status === "accepted" ? "Aceptado" : "Rechazado"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}