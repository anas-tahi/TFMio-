import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../store/auth";

const SKILL_OPTIONS = [
  "Machine Learning", "NLP", "Computer Vision", "Data Science",
  "Web Development", "Databases", "Security", "Robotics",
  "Distributed Systems", "Cloud Computing",
];

const WORK_STYLES = [
  "Applied / engineering-focused",
  "Research-focused",
  "Balanced",
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const loadMe = useAuth((s) => s.loadMe);

  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [interests, setInterests] = useState(user?.interests ?? "");
  const [workStyle, setWorkStyle] = useState(user?.workStyle ?? WORK_STYLES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put("/students/profile", { skills, interests, workStyle });
      await loadMe(); // refresh user in store so aiSummary shows up elsewhere
      navigate("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "No se pudo guardar el perfil";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-slate-900">Completa tu perfil</h1>
          <p className="text-sm text-slate-500 mt-1">
            Esto ayuda a la IA a recomendarte los mejores temas de TFM/TFG.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <label className="block text-xs text-slate-600 mb-1">
            Habilidades técnicas <span className="text-slate-400">(selecciona todas las que apliquen)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {SKILL_OPTIONS.map((skill) => {
              const active = skills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    active
                      ? "bg-brand-light text-brand-dark border-brand-mid font-medium"
                      : "bg-white text-slate-600 border-slate-300 hover:border-brand-mid"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>

          <label className="block text-xs text-slate-600 mb-1">
            Intereses de investigación <span className="text-slate-400">(texto libre)</span>
          </label>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={3}
            className="w-full mb-4 px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Ej: sistemas de recomendación, LLMs, tecnología educativa"
          />

          <label className="block text-xs text-slate-600 mb-1">Estilo de trabajo preferido</label>
          <select
            value={workStyle}
            onChange={(e) => setWorkStyle(e.target.value)}
            className="w-full mb-5 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            {WORK_STYLES.map((ws) => (
              <option key={ws} value={ws}>{ws}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark disabled:opacity-60 transition"
          >
            {saving ? "Guardando…" : "Guardar perfil"}
          </button>
        </form>
      </div>
    </div>
  );
}