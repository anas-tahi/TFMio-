import { useEffect, useState } from "react";
import api from "../lib/api";

// Same tag list used for topic skills and student skills, so profiles,
// topics and proposals all describe areas in the same vocabulary.
const AREA_OPTIONS = [
  "Machine Learning", "NLP", "Computer Vision", "Data Science",
  "Web Development", "Databases", "Security", "Robotics",
  "Distributed Systems", "Cloud Computing",
];

const MAX_BIO = 1500;

export default function TutorProfile() {
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ aiIndexed: boolean } | null>(null);

  useEffect(() => {
    api
      .get<{ bio: string; areas: string[]; department: string }>("/tutors/profile")
      .then((res) => {
        setBio(res.data.bio);
        setAreas(res.data.areas);
        setDepartment(res.data.department);
      })
      .catch(() => setError("No se pudo cargar tu perfil"))
      .finally(() => setLoading(false));
  }, []);

  function toggleArea(area: string) {
    setResult(null);
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setResult(null);
    try {
      const res = await api.put<{ aiIndexed: boolean }>("/tutors/profile", { bio, areas });
      setResult({ aiIndexed: res.data.aiIndexed });
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo guardar el perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Mi perfil de tutor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cuéntanos en qué áreas trabajas. La IA usa este perfil para sugerir tutores a los
            estudiantes que proponen un tema y para proponer miembros de tribunal.
          </p>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}

        {!loading && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            {error && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {department && (
              <div className="mb-4 text-xs text-slate-500">
                Departamento: <span className="text-slate-700">{department}</span>
              </div>
            )}

            <label className="block text-xs text-slate-600 mb-1">
              Áreas de especialidad <span className="text-slate-400">(selecciona todas las que apliquen)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {AREA_OPTIONS.map((area) => {
                const active = areas.includes(area);
                return (
                  <button
                    type="button"
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      active
                        ? "bg-brand-light text-brand-dark border-brand-mid font-medium"
                        : "bg-white text-slate-600 border-slate-300 hover:border-brand-mid"
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>

            <label className="block text-xs text-slate-600 mb-1">
              Biografía <span className="text-slate-400">(líneas de investigación, tipo de TFM que sueles dirigir…)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                setResult(null);
                setBio(e.target.value.slice(0, MAX_BIO));
              }}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Ej: Investigo procesamiento del lenguaje natural y sistemas de recomendación. Suelo dirigir TFM aplicados con componente de IA."
            />
            <div className="text-[11px] text-slate-400 text-right mb-4">
              {bio.length} / {MAX_BIO}
            </div>

            {result && result.aiIndexed && (
              <div className="mb-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Perfil guardado. Ya se usa para las sugerencias de IA.
              </div>
            )}
            {result && !result.aiIndexed && (
              <div className="mb-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Perfil guardado, pero no se pudo actualizar el índice de IA. Comprueba que Ollama
                está en marcha y vuelve a guardar.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-brand-dark text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
            >
              {saving ? "Guardando…" : "Guardar perfil"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}