import { useEffect, useState } from "react";
import api from "../lib/api";

interface PersonRef {
  fullName: string;
}
interface TopicRef {
  title: string;
}

interface ChatItem {
  work: {
    _id: string;
    student: PersonRef;
    tutor: PersonRef;
    topic: TopicRef;
  };
  unreadCount: number;
}

export default function ChatInbox() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ chats: ChatItem[] }>("/messages")
      .then((res) => setChats(res.data.chats))
      .catch(() => setError("No se pudieron cargar tus conversaciones"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Mensajes</h1>
          <p className="text-sm text-slate-500 mt-1">Habla directamente con tu tutor o estudiante.</p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && chats.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">
            Aún no tienes ninguna conversación. Se abre automáticamente cuando tienes un tema asignado.
          </div>
        )}

        <div className="space-y-2">
          {chats.map((c) => (
            <a
              key={c.work._id}
              href={`/chat/${c.work._id}`}
              className="block bg-white rounded-2xl border border-slate-200 p-4 hover:border-brand transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {c.work.student.fullName} · {c.work.tutor.fullName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.work.topic.title}</div>
                </div>
                {c.unreadCount > 0 && (
                  <span className="bg-brand text-white text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}