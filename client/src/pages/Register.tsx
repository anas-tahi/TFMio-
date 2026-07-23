import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import type { UserRole } from "../types";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);
  const loading = useAuth((s) => s.loading);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await register({ fullName, email, password, role });
      navigate("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed";
      setError(msg);
    }
  }

  const roles: { value: UserRole; label: string }[] = [
    { value: "student", label: "Estudiante" },
    { value: "tutor", label: "Tutor" },
    { value: "coordinator", label: "Coordinador" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-brand tracking-tight">
            TFM<span className="text-brand-mid">io</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <label className="block text-xs text-slate-600 mb-1">Nombre completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />

          <label className="block text-xs text-slate-600 mb-1">Correo universitario</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />

          <label className="block text-xs text-slate-600 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />

          <label className="block text-xs text-slate-600 mb-1">Soy…</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {roles.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`py-2 rounded-lg text-xs font-medium border transition ${
                  role === r.value
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-slate-600 border-slate-300 hover:border-brand-mid"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark disabled:opacity-60 transition"
          >
            {loading ? "Creando…" : "Crear cuenta"}
          </button>

          <p className="text-center text-xs text-slate-500 mt-4">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-brand font-medium">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
