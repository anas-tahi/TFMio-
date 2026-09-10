import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../store/auth";

interface SenderRef {
  fullName: string;
}

interface MessageItem {
  _id: string;
  sender: {_id: string; fullName: string}
  text: string;
  createdAt: string;
}

const POLL_INTERVAL_MS = 5000;

export default function Chat() {
  const { workId } = useParams<{ workId: string }>();
  const currentUser = useAuth((s) => s.user);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function load(silent = false) {
    if (!silent) setLoading(true);
    api
      .get<{ messages: MessageItem[] }>(`/messages/${workId}`)
      .then((res) => setMessages(res.data.messages))
      .catch(() => setError("No se pudo cargar la conversación"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [workId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/${workId}`, { text });
      setText("");
      load(true);
    } catch {
      alert("No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  }

  function isMine(msg: MessageItem): boolean {
    return msg.sender._id === currentUser?._id;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/chat" className="text-xs text-brand font-medium">← Mensajes</a>
          <span className="text-sm font-medium text-slate-800 ml-2">Conversación</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 overflow-y-auto">
        {loading && <div className="text-sm text-slate-500 text-center">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="text-sm text-slate-400 text-center mt-10">
            Aún no hay mensajes. Escribe el primero.
          </div>
        )}

        <div className="space-y-2">
          {messages.map((msg) => {
            const mine = isMine(msg);
            const senderName = msg.sender.fullName;
            return (
              <div key={msg._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  {!mine && <div className="text-[10px] text-slate-400 mb-0.5">{senderName}</div>}
                  {msg.text}
                  <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje…"
            className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="text-xs px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition disabled:opacity-60"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}