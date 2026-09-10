import { useEffect, useState } from "react";
import api from "../lib/api";

interface StudentRef {
  fullName: string;
  email: string;
}
interface TutorRef {
  _id: string;
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
}

interface JuryOption {
  _id: string;
  fullName: string;
  department: string;
}

export default function ScheduleDefense() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [juryPool, setJuryPool] = useState<JuryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formState, setFormState] = useState
    Record<string, { date: string; time: string; room: string; jury: string[] }>
  >({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  function load() {
    setLoading(true);
    Promise.all([
      api.get<{ works: WorkItem[] }>("/defense/ready"),
      api.get<{ tutors: JuryOption[] }>("/defense/jury-pool"),
    ])
      .then(([worksRes, juryRes]) => {
        setWorks(worksRes.data.works);
        setJuryPool(juryRes.data.tutors);
      })
      .catch(() => setError("No se pudieron cargar los datos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function updateForm(workId: string, field: string, value: string | string[]) {
    setFormState((s) => ({
      ...s,
      [workId]: { date: "", time: "", room: "", jury: [], ...s[workId], [field]: value },
    }));
  }

  function toggleJury(workId: string, tutorId: string) {
    const current = formState[workId]?.jury || [];
    const next = current.includes(tutorId)
      ? current.filter((id) => id !== tutorId)
      : [...current, tutorId];
    updateForm(workId, "jury", next);
  }

  async function handleSchedule(workId: string) {
    const form = formState[workId];
    if (!form?.date || !form?.time || !form?.room || !form?.jury?.length) {
      alert("Completa fecha, hora, sala y al menos un miembro del tribunal");
      return;
    }
    setSubmitting((s) => ({ ...s, [workId]: true }));
    try {
      await api.patch(`/defense/${workId}/schedule`, form);
      setWorks((prev) => prev.filter((w) => w._id !== workId));
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo programar la defensa");
    } finally {
      setSubmitting((s) => ({ ...s, [workId]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Programar defensas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Trabajos con memoria aprobada, listos para defender.
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && works.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">
            No hay trabajos listos para programar defensa todavía.
          </div>
        )}

        <div className="space-y-4">
          {works.map((w) => {
            const form = formState[w._id] || { date: "", time: "", room: "", jury: [] };
            return (
              <div key={w._id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-sm font-medium text-slate-900">{w.student.fullName}</div>
                <div className="text-xs text-slate-500">{w.student.email}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Tema: <span className="text-slate-700">{w.topic.title}</span> · Tutor:{" "}
                  <span className="text-slate-700">{w.tutor.fullName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Fecha</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => updateForm(w._id, "date", e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Hora</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => updateForm(w._id, "time", e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-xs text-slate-500 mb-1 block">Sala</label>
                  <input
                    value={form.room}
                    onChange={(e) => updateForm(w._id, "room", e.target.value)}
                    placeholder="p. ej. Sala A3"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs text-slate-500 mb-1 block">Tribunal</label>
                  <div className="flex flex-wrap gap-2">
                    {juryPool
                      .filter((t) => t._id !== w.tutor._id)
                      .map((t) => (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => toggleJury(w._id, t._id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border ${
                            form.jury.includes(t._id)
                              ? "bg-brand text-white border-brand"
                              : "border-slate-300 text-slate-600"
                          }`}
                        >
                          {t.fullName}
                        </button>
                      ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSchedule(w._id)}
                  disabled={submitting[w._id]}
                  className="text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60 mt-4"
                >
                  {submitting[w._id] ? "Programando…" : "Programar defensa"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}