import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../store/auth";

export default function Activate() {
  const navigate = useNavigate();
  const setToken = useAuth((s) => s.setToken);

  const [step, setStep] = useState<"verify" | "password">("verify");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ fullName: string; role: string }>("/auth/activate/verify", {
        email,
        code,
      });
      setFullName(res.data.fullName);
      setStep("password");
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo verificar el código");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>("/auth/activate/complete", {
        email,
        code,
        password,
      });
      setToken(res.data.token);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo activar la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div style={{ fontSize: 20, fontWeight: 700, color: "#534AB7" }}>
            TFM<span style={{ color: "#7F77DD" }}>io</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Activación de cuenta</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Correo académico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="nombre.apellido@correo.ugr.es"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Código de activación</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs px-4 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60"
              >
                {loading ? "Verificando…" : "Verificar"}
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleSetPassword} className="space-y-3">
              <div className="text-sm text-slate-700 mb-2">
                Hola, <strong>{fullName}</strong>. Crea tu contraseña para continuar.
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Nueva contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              {error && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs px-4 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60"
              >
                {loading ? "Guardando…" : "Crear contraseña y entrar"}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-4">
          <a href="/login" className="text-xs text-brand font-medium">
            ¿Ya tienes contraseña? Inicia sesión
          </a>
        </div>
      </div>
    </div>
  );
}