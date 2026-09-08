import { useEffect, useState } from "react";
import api from "../lib/api";

interface TutorRef {
  fullName: string;
}

interface ProposalItem {
  _id: string;
  title: string;
  description: string;
  type: "TFM" | "TFG";
  tutor: TutorRef;
  status: "pending" | "revision_requested" | "accepted" | "rejected";
  revisionNote?: string;
  revisionCount: number;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente de revisión",
  revision_requested: "Cambios solicitados",
  accepted: "Aceptada",
  rejected: "Rechazada",
};
const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  revision_requested: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-slate-100 text-slate-500",
};

export default function MyProposals() {
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api
      .get<{ proposals: ProposalItem[] }>("/proposals/mine")
      .then((res) => setItems(res.data.proposals))
      .catch(() => setError("No se pudieron cargar tus propuestas"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item: ProposalItem) {
    setEditingId(item._id);
    setEditTitle(item.title);
    setEditDescription(item.description);
  }

  async function resubmit(id: string) {
    if (editTitle.trim().length < 5 || editDescription.trim().length < 20) {
      alert("Título de al menos 5 caracteres, descripción de al menos 20");
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/proposals/${id}`, { title: editTitle, description: editDescription });
      setEditingId(null);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo reenviar la propuesta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Mis propuestas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Temas que has propuesto directamente a un tutor.
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
            Aún no has propuesto ningún tema.{" "}
            <a href="/propose-topic" className="text-brand font-medium">Proponer uno →</a>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">{item.title}</div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[item.status]}`}>
                  {statusLabels[item.status]}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Tutor: {item.tutor?.fullName} · {item.type}
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.description}</p>

              {item.status === "revision_requested" && item.revisionNote && (
                <div className="mt-3 text-xs bg-amber-50 text-amber-800 rounded-lg px-3 py-2 leading-relaxed">
                  <strong>El tutor pide cambios:</strong> {item.revisionNote}
                </div>
              )}

              {item.status === "revision_requested" && editingId !== item._id && (
                <button
                  onClick={() => startEdit(item)}
                  className="text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition mt-3"
                >
                  Editar y reenviar
                </button>
              )}

              {editingId === item._id && (
                <div className="mt-3 space-y-2">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="Título"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="Descripción"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => resubmit(item._id)}
                      disabled={submitting}
                      className="text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60"
                    >
                      {submitting ? "Enviando…" : "Reenviar propuesta"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}