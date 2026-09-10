import { useEffect, useState } from "react";
import api from "../lib/api";

interface Criterion {
  name: string;
  maxPoints: number;
  weight: number;
}

interface RubricData {
  role: "tutor" | "jury";
  criteria: Criterion[];
  roleWeight: number;
}

const emptyCriterion = (): Criterion => ({ name: "", maxPoints: 10, weight: 1 });

function RubricForm({
  role,
  initial,
  onSaved,
}: {
  role: "tutor" | "jury";
  initial?: RubricData;
  onSaved: () => void;
}) {
  const [criteria, setCriteria] = useState<Criterion[]>(
    initial?.criteria?.length ? initial.criteria : [emptyCriterion()]
  );
  const [roleWeight, setRoleWeight] = useState(initial?.roleWeight ?? 0.5);
  const [saving, setSaving] = useState(false);

  function updateCriterion(i: number, field: keyof Criterion, value: string) {
    setCriteria((prev) =>
      prev.map((c, idx) =>
        idx === i
          ? { ...c, [field]: field === "name" ? value : Number(value) }
          : c
      )
    );
  }

  function addCriterion() {
    setCriteria((prev) => [...prev, emptyCriterion()]);
  }
  function removeCriterion(i: number) {
    setCriteria((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (criteria.some((c) => !c.name.trim())) {
      alert("Todos los criterios necesitan un nombre");
      return;
    }
    setSaving(true);
    try {
      await api.put("/rubrics", { role, criteria, roleWeight });
      onSaved();
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo guardar la rúbrica");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="text-sm font-semibold text-slate-800 mb-3">
        Rúbrica del {role === "tutor" ? "tutor" : "tribunal"}
      </div>

      <div className="space-y-2 mb-3">
        {criteria.map((c, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={c.name}
              onChange={(e) => updateCriterion(i, "name", e.target.value)}
              placeholder="Nombre del criterio"
              className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2"
            />
            <input
              type="number"
              value={c.maxPoints}
              onChange={(e) => updateCriterion(i, "maxPoints", e.target.value)}
              placeholder="Máx."
              className="w-16 text-xs border border-slate-300 rounded-lg px-2 py-2"
            />
            <input
              type="number"
              step="0.1"
              value={c.weight}
              onChange={(e) => updateCriterion(i, "weight", e.target.value)}
              placeholder="Peso"
              className="w-16 text-xs border border-slate-300 rounded-lg px-2 py-2"
            />
            <button
              onClick={() => removeCriterion(i)}
              className="text-xs text-slate-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addCriterion}
        className="text-xs text-brand font-medium mb-4"
      >
        + Añadir criterio
      </button>

      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs text-slate-500">
          Ponderación de este rol en la nota final (0–1)
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={roleWeight}
          onChange={(e) => setRoleWeight(Number(e.target.value))}
          className="w-20 text-xs border border-slate-300 rounded-lg px-2 py-2"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar rúbrica"}
      </button>
    </div>
  );
}

export default function RubricEditor() {
  const [rubrics, setRubrics] = useState<RubricData[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get<{ rubrics: RubricData[] }>("/rubrics/mine")
      .then((res) => setRubrics(res.data.rubrics))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const tutorRubric = rubrics.find((r) => r.role === "tutor");
  const juryRubric = rubrics.find((r) => r.role === "jury");

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Rúbricas de calificación</h1>
          <p className="text-sm text-slate-500 mt-1">
            Define criterios distintos para el tutor y el tribunal, con su propia ponderación.
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Cargando…</div>
        ) : (
          <div className="space-y-4">
            <RubricForm role="tutor" initial={tutorRubric} onSaved={load} />
            <RubricForm role="jury" initial={juryRubric} onSaved={load} />
          </div>
        )}
      </div>
    </div>
  );
}