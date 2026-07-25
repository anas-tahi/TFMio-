import { useAuth } from "../store/auth";

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
    "Supervisar tus trabajos activos",
  ],
  coordinator: [
    "Ver el tablero de ciclo de vida",
    "Aprobar emparejamientos y temas",
    "Programar defensas y gestionar calificaciones",
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
          Bienvenido a TFMio. Esta es la base del proyecto — Fase 1 completada.
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
          <p className="text-xs text-slate-400 mt-4">
            Estas funciones se construirán en la Fase 2 y Fase 3.
          </p>
          {user.role === "student" && (
            <a
              href="/profile-setup"
              className="inline-block mt-4 text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition"
            >
              Completar mi perfil →
            </a>
          )}
          {user.role === "tutor" && (
            <a
              href="/topics/new"
              className="inline-block mt-4 text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition"
            >
              Publicar un tema →
            </a>
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
            <div className="text-sm font-medium text-slate-600 mt-1">Emparejamiento</div>
            <div className="text-xs text-slate-400 mt-1">Próximamente</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Fase 3</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Ciclo de vida</div>
            <div className="text-xs text-slate-400 mt-1">Próximamente</div>
          </div>
        </div>
      </main>
    </div>
  );
}