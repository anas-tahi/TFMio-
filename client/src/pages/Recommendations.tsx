import { useEffect, useState } from "react";
import api from "../lib/api";

interface Tutor {
  fullName: string;
  department: string;
}

interface DegreeRef {
  shortName: string;
}

interface Recommendation {
  _id: string;
  title: string;
  description: string;
  department: string;
  type: "TFM" | "TFG";
  skills?: string[];
  tutor: Tutor;
  degrees: DegreeRef[];
  matchScore: number;
}

export default function Recommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ recommendations: Recommendation[] }>("/recommendations")
      .then((res) => setItems(res.data.recommendations))
      .catch((err) => {
        const msg =
          err?.response?.data?.message || "No se pudieron cargar las recomendaciones";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Recomendaciones de IA</h1>
          <p className="text-sm text-slate-500 mt-1">
            Temas ordenados por afinidad con tu perfil, calculada por similitud de embeddings.
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading && (
          <div className="text-sm text-slate-500">Calculando recomendaciones…</div>
        )}

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">
            Aún no hay temas publicados para comparar con tu perfil.
          </div>
        )}

        <div className="space-y-3">
          {items.map((topic, index) => (
            <div
              key={topic._id}
              className={`bg-white rounded-2xl border p-5 ${
                index === 0 ? "border-brand-mid" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                {index === 0 && (
                  <span className="text-[10px] font-medium text-brand bg-brand-light px-2 py-0.5 rounded-full">
                    Mejor recomendación
                  </span>
                )}
                <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-brand text-white">
                  {topic.matchScore}% afinidad
                </span>
              </div>

              <div className="text-sm font-medium text-slate-900">{topic.title}</div>
              <div className="text-xs text-slate-500 mt-1">
                {topic.tutor?.fullName} · {topic.department} · {topic.type}
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{topic.description}</p>

              {topic.skills && topic.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {topic.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}