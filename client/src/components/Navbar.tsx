import { useState, useRef, useEffect } from "react";
import { useAuth } from "../store/auth";
import { displayFirstName } from "../lib/names";
import NotificationBell from "./NotificationBell";

const roleLabels: Record<string, string> = {
  student: "Estudiante",
  tutor: "Tutor",
  coordinator: "Coordinador",
};

const roleLinks: Record<string, { href: string; label: string }[]> = {
  student: [
    { href: "/", label: "Panel" },
    { href: "/my-works", label: "Mi TFM" },
    { href: "/recommendations", label: "Recomendaciones" },
    { href: "/propose-topic", label: "Proponer tema" },
    { href: "/chat", label: "Mensajes" },
  ],
  tutor: [
    { href: "/", label: "Panel" },
    { href: "/my-works", label: "Mis trabajos" },
    { href: "/requests", label: "Solicitudes" },
    { href: "/proposals", label: "Propuestas" },
    { href: "/history", label: "Historial" },
    { href: "/chat", label: "Mensajes" },
  ],
  coordinator: [
    { href: "/", label: "Panel" },
    { href: "/coordinator/matches", label: "Emparejamientos" },
    { href: "/coordinator/history", label: "Historial" },
    { href: "/coordinator/calendar", label: "Calendario" },
  ],
};

export default function Navbar() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const links = roleLinks[user.role] ?? [];
  const firstName = displayFirstName(user.fullName);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
        <a href="/" className="text-xl font-bold text-brand-dark tracking-tight flex-shrink-0">
          TFM<span className="text-brand">io</span>
        </a>

        <nav className="hidden md:flex items-center gap-5 flex-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate-600 hover:text-brand-dark transition"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition"
            >
              <span className="w-7 h-7 rounded-full bg-brand-light text-brand-dark flex items-center justify-center text-xs font-semibold">
                {firstName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{firstName}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-medium text-slate-800">{user.fullName}</div>
                  <div className="text-[11px] text-brand mt-0.5">{roleLabels[user.role]}</div>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav links */}
      <nav className="md:hidden flex overflow-x-auto gap-4 px-4 pb-3 -mt-1">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-xs text-slate-600 whitespace-nowrap hover:text-brand-dark transition"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}