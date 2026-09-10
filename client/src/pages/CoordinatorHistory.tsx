import { useEffect, useState } from "react";
import api from "../lib/api";

interface StudentRef {
  fullName: string;
  email: string;
}
interface TutorRef {
  fullName: string;
}
interface TopicRef {
  title: string;
}
interface Defense {
  date?: string;
}

interface WorkItem {
  _id: string;
  student: StudentRef;
  tutor: TutorRef;
  topic: TopicRef;
  stage: string;
  defense?: Defense;
}

const stageLabels: Record<string, string> = {
  matched: "Emparejado",
  approved: "Aprobado",
  in_progress: "En progreso",
  defense_ready: "Listo para defensa",
  defended: "Defendido",
  graded: "Calificado",
};

export default function CoordinatorHistory() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ works: WorkItem[] }>("/history/coordinator")
      .then((res) => setItems(res.data.works))
      .catch(() => setError("No se pudo cargar el historial"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Historial de tu titulación</h1>
          <p className="text-sm text-slate-500 mt-1">
            Todos los trabajos en curso o finalizados de tu titulación.
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
            Aún no hay trabajos en tu titulación.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Estudiante</th>
                  <th className="px-4 py-3">Tutor</th>
                  <th className="px-4 py-3">Tema</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha de defensa</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{item.student.fullName}</div>
                      <div className="text-xs text-slate-400">{item.student.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.tutor.fullName}</td>
                    <td className="px-4 py-3 text-slate-700">{item.topic.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {stageLabels[item.stage] ?? item.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {item.defense?.date
                        ? new Date(item.defense.date).toLocaleDateString("es-ES")
                        : "Sin programar"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}