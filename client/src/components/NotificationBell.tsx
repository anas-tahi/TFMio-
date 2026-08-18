import { useEffect, useRef, useState } from "react";
import api from "../lib/api";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

const POLL_INTERVAL_MS = 15000;

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function load() {
    api
      .get<{ notifications: NotificationItem[]; unreadCount: number }>("/notifications")
      .then((res) => {
        setItems(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {
        // Silently ignore — the bell just stays at its last known state
      });
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unreadCount > 0) {
      try {
        await api.patch("/notifications/read-all");
        setUnreadCount(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
        aria-label="Notificaciones"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-700">
            Notificaciones
          </div>
          {items.length === 0 && (
            <div className="px-4 py-6 text-xs text-slate-400 text-center">
              No tienes notificaciones
            </div>
          )}
          {items.map((n) => (
            <a
              key={n._id}
              href={n.link || "#"}
              className={`block px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition ${
                !n.read ? "bg-brand-light/40" : ""
              }`}
            >
              <div className="text-xs font-medium text-slate-800">{n.title}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                {new Date(n.createdAt).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}