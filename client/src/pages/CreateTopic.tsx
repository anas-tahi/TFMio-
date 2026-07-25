import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Degree {
  _id: string;
  name: string;
  shortName: string;
  level: "TFM" | "TFG";
}

const SKILL_OPTIONS = [
  "Machine Learning", "NLP", "Computer Vision", "Data Science",
  "Web Development", "Databases", "Security", "Robotics",
  "Distributed Systems", "Cloud Computing",
];

export default function CreateTopic() {
  const navigate = useNavigate();
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState<"TFM" | "TFG">("TFM");
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [totalSpots, setTotalSpots] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ degrees: Degree[] }>("/degrees").then((res) => setDegrees(res.data.degrees));
  }, []);

  function toggleDegree(id: string) {
    setSelectedDegrees((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/topics", {
        title,
        description,
        department,
        type,
        degrees: selectedDegrees,
        skills,
        totalSpots,
        status: publish ? "active" : "draft",
      });
      navigate("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; errors?: { message: string }[] } } })
          ?.response?.data;
      setError(msg?.errors?.[0]?.message || msg?.message || "No se pudo crear el tema");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-slate-900">Publicar un tema de TFM/TFG</h1>
          <p className="text-sm text-slate-500 mt-1">
            La descripción se usará para generar recomendaciones automáticas a los estudiantes.
          </p>
        </div>

        <form className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <label className="block text-xs text-slate-600 mb-1">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
            className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Ej: Sistema de recomendación inteligente para proyectos académicos"
          />

          <label className="block text-xs text-slate-600 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={20}
            rows={4}
            className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Describe el tema, sus objetivos y qué se espera del estudiante..."
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Departamento</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="Ej: DECSAI"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "TFM" | "TFG")}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <option value="TFM">TFM</option>
                <option value="TFG">TFG</option>
              </select>
            </div>
          </div>

          <label className="block text-xs text-slate-600 mb-1">
            Titulaciones a las que aplica <span className="text-slate-400">(selecciona al menos una)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {degrees.map((d) => {
              const active = selectedDegrees.includes(d._id);
              return (
                <button
                  type="button"
                  key={d._id}
                  onClick={() => toggleDegree(d._id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    active
                      ? "bg-brand-light text-brand-dark border-brand-mid font-medium"
                      : "bg-white text-slate-600 border-slate-300 hover:border-brand-mid"
                  }`}
                >
                  {d.shortName}
                </button>
              );
            })}
            {degrees.length === 0 && (
              <span className="text-xs text-slate-400">
                No hay titulaciones cargadas — ejecuta el seed script.
              </span>
            )}
          </div>

          <label className="block text-xs text-slate-600 mb-1">
            Habilidades relevantes <span className="text-slate-400">(opcional)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
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

          <label className="block text-xs text-slate-600 mb-1">Plazas disponibles</label>
          <input
            type="number"
            min={1}
            value={totalSpots}
            onChange={(e) => setTotalSpots(Number(e.target.value))}
            className="w-24 mb-5 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />

          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={(e) => handleSubmit(e, false)}
              className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition"
            >
              Guardar como borrador
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={(e) => handleSubmit(e, true)}
              className="flex-1 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark disabled:opacity-60 transition"
            >
              {saving ? "Publicando…" : "Publicar tema"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}