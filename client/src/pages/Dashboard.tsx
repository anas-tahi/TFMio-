import { useAuth } from "../store/auth";
import NotificationBell from "../components/NotificationBell";

const roleLabels: Record<string, string> = {
  student: "Estudiante",
  tutor: "Tutor",
  coordinator: "Coordinador",
};

const roleNextSteps: Record<string, string[]> = {
  student: [
    "Completar tu perfil (habilidades e intereses)",
    "Explorar temas con el sistema de tarjetas",
    "Ver recomendaciones generadas por IA",
  ],
  tutor: [
    "Publicar tus temas de TFM/TFG",
    "Revisar solicitudes de estudiantes",
    "Confirmar la decisión final tras la revisión del coordinador",
  ],
  coordinator: [
    "Revisar emparejamientos pendientes",
    "Aprobar, rechazar o no intervenir",
    "La decisión final la confirma el tutor",
  ],
};

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  if (!user) return null;

  const steps = roleNextSteps[user.role] ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl font-bold text-brand tracking-tight">
            TFM<span className="text-brand-mid">io</span>
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-brand-light text-brand-dark font-medium">
            {roleLabels[user.role]}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <span className="text-sm text-slate-600">{user.fullName}</span>
            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Hola, {user.fullName.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bienvenido a TFMio.
        </p>

        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Próximos pasos para tu rol
          </h2>
          <ul className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-light text-brand-dark text-xs font-medium flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
          {user.role === "student" && (
            <div className="flex flex-wrap gap-2 mt-4">
              <a
                href="/profile-setup"
                className="inline-block text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition"
              >
                Completar mi perfil →
              </a>
              <a
                href="/recommendations"
                className="inline-block text-xs px-4 py-2 rounded-lg border border-brand text-brand font-medium hover:bg-brand-light transition"
              >
                Ver mis recomendaciones →
              </a>
              <a
                href="/propose-topic"
                className="inline-block text-xs px-4 py-2 rounded-lg border border-brand text-brand font-medium hover:bg-brand-light transition"
              >
                Proponer un tema →
              </a>
            </div>
          )}
          {user.role === "tutor" && (
            <div className="flex flex-wrap gap-2 mt-4">
              <a
                href="/topics/new"
                className="inline-block text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition"
              >
                Publicar un tema →
              </a>
              <a
                href="/requests"
                className="inline-block text-xs px-4 py-2 rounded-lg border border-brand text-brand font-medium hover:bg-brand-light transition"
              >
                Ver solicitudes de estudiantes →
              </a>
              <a
                href="/proposals"
                className="inline-block text-xs px-4 py-2 rounded-lg border border-brand text-brand font-medium hover:bg-brand-light transition"
              >
                Ver propuestas de estudiantes →
              </a>
              <a
                href="/final-decisions"
                className="inline-block text-xs px-4 py-2 rounded-lg border border-brand text-brand font-medium hover:bg-brand-light transition"
              >
                Decisiones finales →
              </a>
            </div>
          )}
          {user.role === "coordinator" && (
            <div className="flex flex-wrap gap-2 mt-4">
              <a
                href="/coordinator/matches"
                className="inline-block text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition"
              >
                Revisar emparejamientos →
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Fase 1</div>
            <div className="text-sm font-medium text-green-700 mt-1">✓ Completada</div>
            <div className="text-xs text-slate-400 mt-1">Auth, modelos, IA base</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Fase 2</div>
            <div className="text-sm font-medium text-green-700 mt-1">✓ Completada</div>
            <div className="text-xs text-slate-400 mt-1">Emparejamiento con IA</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Fase 3</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Ciclo de vida</div>
            <div className="text-xs text-slate-400 mt-1">En curso</div>
          </div>
        </div>
      </main>
    </div>
  );
}