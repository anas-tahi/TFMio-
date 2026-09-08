import { useEffect, useState } from "react";
import api from "../lib/api";

interface StudentRef {
  fullName: string;
  email: string;
}

interface ProposalItem {
  _id: string;
  student: StudentRef;
  title: string;
  description: string;
  type: "TFM" | "TFG";
  status: "pending" | "revision_requested" | "accepted" | "rejected";
  revisionNote?: string;
  revisionCount: number;
}

export default function Proposals() {
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<{ proposals: ProposalItem[] }>("/proposals/received")
      .then((res) => setItems(res.data.proposals))
      .catch(() => setError("No se pudieron cargar las propuestas"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, decision: "accept" | "reject" | "request_changes") {
    const note = noteDraft[id]?.trim();
    if (decision === "request_changes" && !note) {
      alert("Escribe qué cambios pides antes de enviar");
      return;
    }
    setBusy((s) => ({ ...s, [id]: true }));
    try {
      await api.patch(`/proposals/${id}/decision`, { decision, note: note || undefined });
      setShowNoteFor(null);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo procesar la decisión");
    } finally {
      setBusy((s) => ({ ...s, [id]: false }));
    }
  }

  const pending = items.filter((i) => i.status === "pending");
  const decided = items.filter((i) => i.status !== "pending");

  const statusLabels: Record<string, string> = {
    revision_requested: "Cambios solicitados",
    accepted: "Aceptada",
    rejected: "Rechazada",
  };
  const statusColors: Record<string, string> = {
    revision_requested: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    rejected: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Propuestas de estudiantes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ideas de temas que los estudiantes te han enviado directamente.
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && pending.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center mb-6">
            No tienes propuestas pendientes.
          </div>
        )}

        <div className="space-y-3 mb-8">
          {pending.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">{item.student.fullName}</div>
                  <div className="text-xs text-slate-500">{item.student.email}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {item.type}
                </span>
              </div>

              <div className="text-sm font-medium text-slate-800 mt-3">{item.title}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>

              {item.revisionCount > 0 && (
                <div className="text-[10px] text-slate-400 mt-2">
                  Reenviada tras {item.revisionCount} ronda(s) de cambios
                </div>
              )}

              {showNoteFor === item._id && (
                <textarea
                  value={noteDraft[item._id] || ""}
                  onChange={(e) => setNoteDraft((s) => ({ ...s, [item._id]: e.target.value }))}
                  placeholder="Explica qué le gustaría que cambiara el estudiante…"
                  rows={3}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 mt-3"
                />
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => decide(item._id, "accept")}
                  disabled={busy[item._id]}
                  className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  Aceptar
                </button>
                {showNoteFor === item._id ? (
                  <button
                    onClick={() => decide(item._id, "request_changes")}
                    disabled={busy[item._id]}
                    className="text-xs px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition disabled:opacity-60"
                  >
                    Enviar solicitud de cambios
                  </button>
                ) : (
                  <button
                    onClick={() => setShowNoteFor(item._id)}
                    disabled={busy[item._id]}
                    className="text-xs px-4 py-2 rounded-lg border border-amber-400 text-amber-600 hover:bg-amber-50 transition disabled:opacity-60"
                  >
                    Solicitar cambios
                  </button>
                )}
                <button
                  onClick={() => decide(item._id, "reject")}
                  disabled={busy[item._id]}
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
              Historial
            </h2>
            <div className="space-y-2">
              {decided.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm text-slate-800">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.student.fullName}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[item.status]}`}>
                    {statusLabels[item.status]}
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