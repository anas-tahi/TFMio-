import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const loading = useAuth((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Login failed";
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0f0a0b] px-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] bg-brand-dark/60 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-brand-mid/20 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-white tracking-tight">
            TFM<span className="text-brand">io</span>
          </div>
          <p className="text-sm text-white/60 mt-2">Encuentra tu TFM. Gestiona tu camino.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur rounded-2xl border border-white/20 p-6 shadow-2xl"
        >
          <h1 className="text-lg font-semibold mb-4 text-slate-900">Iniciar sesión</h1>

          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </div>
          )}

          <label className="block text-xs text-slate-600 mb-1">Correo universitario</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mb-3 px-3 py-2.5 rounded-lg border border-slate-300 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            placeholder="nombre@correo.ugr.es"
          />

          <label className="block text-xs text-slate-600 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mb-4 px-3 py-2.5 rounded-lg border border-slate-300 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-dark text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <p className="text-center text-xs text-slate-500 mt-4">
            ¿Tienes un código de activación de la universidad?{" "}
            <Link to="/activate" className="text-brand font-medium hover:text-brand-dark transition">
              Activa tu cuenta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}