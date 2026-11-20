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

interface JurySuggestionItem {
  tutorId: string;
  fullName: string;
  department: string;
  score: number;
}

export default function ScheduleDefense() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [juryPool, setJuryPool] = useState<JuryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  type FormStateType = Record<
    string,
    { date: string; time: string; room: string; jury: string[] }
  >;
  const [formState, setFormState] = useState<FormStateType>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const [suggestions, setSuggestions] = useState<Record<string, JurySuggestionItem[]>>({});
  const [suggesting, setSuggesting] = useState<Record<string, boolean>>({});
  const [suggestError, setSuggestError] = useState<Record<string, string>>({});

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
      [workId]: { ...{ date: "", time: "", room: "", jury: [] }, ...s[workId], [field]: value },
    }));
  }

  function toggleJury(workId: string, tutorId: string) {
    const current = formState[workId]?.jury || [];
    const next = current.includes(tutorId)
      ? current.filter((id) => id !== tutorId)
      : [...current, tutorId];
    updateForm(workId, "jury", next);
  }

  async function handleSuggestJury(workId: string) {
    setSuggesting((s) => ({ ...s, [workId]: true }));
    setSuggestError((e) => ({ ...e, [workId]: "" }));
    try {
      const res = await api.get<{ suggestions: JurySuggestionItem[] }>(
        `/defense/${workId}/jury-suggestion`
      );
      setSuggestions((s) => ({ ...s, [workId]: res.data.suggestions }));
      updateForm(
        workId,
        "jury",
        res.data.suggestions.map((sg) => sg.tutorId)
      );
    } catch (err: any) {
      setSuggestError((e) => ({
        ...e,
        [workId]: err?.response?.data?.message || "No se pudo calcular una sugerencia",
      }));
    } finally {
      setSuggesting((s) => ({ ...s, [workId]: false }));
    }
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
    <div className="px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Programar defensas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Trabajos con memoria aprobada, listos para defender.
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
            No hay trabajos listos para programar defensa todavía.
          </div>
        )}

        <div className="space-y-4">
          {works.map((w) => {
            const form = formState[w._id] || { date: "", time: "", room: "", jury: [] };
            const workSuggestions = suggestions[w._id];
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

                <div className="mt-3 flex items-center justify-between">
                  <label className="text-xs text-slate-500 block">Tribunal</label>
                  <button
                    type="button"
                    onClick={() => handleSuggestJury(w._id)}
                    disabled={suggesting[w._id]}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-brand text-brand hover:bg-brand-light transition disabled:opacity-60"
                  >
                    {suggesting[w._id] ? "Calculando…" : "Sugerir tribunal (IA)"}
                  </button>
                </div>

                {suggestError[w._id] && (
                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    {suggestError[w._id]}
                  </div>
                )}

                {workSuggestions && workSuggestions.length > 0 && (
                  <div className="mt-2 rounded-lg border border-brand-mid/40 bg-brand-light/40 p-2.5 space-y-1">
                    {workSuggestions.map((s) => (
                      <div key={s.tutorId} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-700">
                          {s.fullName} <span className="text-slate-400">· {s.department}</span>
                        </span>
                        <span className="font-semibold px-1.5 py-0.5 rounded-full bg-brand-dark text-white">
                          {s.score}%
                        </span>
                      </div>
                    ))}
                    <div className="text-[10px] text-slate-500 pt-1">
                      Sugerencia orientativa, ya marcada abajo. Puedes cambiarla libremente.
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {juryPool
                    .filter((t) => t._id !== w.tutor._id)
                    .map((t) => (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => toggleJury(w._id, t._id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border ${
                          form.jury.includes(t._id)
                            ? "bg-brand-dark text-white border-brand-dark"
                            : "border-slate-300 text-slate-600"
                        }`}
                      >
                        {t.fullName}
                      </button>
                    ))}
                </div>

                <button
                  onClick={() => handleSchedule(w._id)}
                  disabled={submitting[w._id]}
                  className="text-xs px-4 py-2 rounded-lg bg-brand-dark text-white font-medium hover:opacity-90 transition disabled:opacity-60 mt-4"
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