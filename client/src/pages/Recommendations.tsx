import { useEffect, useRef, useState } from "react";
import api from "../lib/api";

interface Tutor {
  fullName: string;
  department: string;
}

interface Recommendation {
  _id: string;
  title: string;
  description: string;
  department: string;
  type: "TFM" | "TFG";
  skills?: string[];
  tutor: Tutor;
  matchScore: number;
}

export default function Recommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    api
      .get<{ recommendations: Recommendation[] }>("/recommendations")
      .then((res) => setItems(res.data.recommendations))
      .catch((err) => {
        const msg =
          err?.response?.data?.message || "No se pudieron cargar las recomendaciones";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const current = items[index];
  const hasMore = current !== undefined;

  async function advance(action: "interested" | "skipped") {
    if (!current || sending) return;

    if (action === "interested") {
      setSending(true);
      try {
        await api.post("/interests", { topicId: current._id });
      } catch (err: any) {
        // Duplicate interest or profile-missing errors still allow moving on
        const msg = err?.response?.data?.message;
        if (msg) alert(msg);
      } finally {
        setSending(false);
      }
    }

    setDragX(0);
    setIndex((i) => i + 1);
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startX.current = e.clientX;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    setDragX(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragX > 100) advance("interested");
    else if (dragX < -100) advance("skipped");
    else setDragX(0);
  }

  const rotation = dragX / 20;
  const rightOpacity = Math.min(Math.max(dragX / 100, 0), 1);
  const leftOpacity = Math.min(Math.max(-dragX / 100, 0), 1);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Explora tus temas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Desliza a la derecha si te interesa, a la izquierda para pasar.
          </p>
          <a href="/" className="text-xs text-brand font-medium">← Volver al panel</a>
        </div>

        {loading && (
          <div className="text-sm text-slate-500 text-center">Calculando recomendaciones…</div>
        )}

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">
            Aún no hay temas publicados para comparar con tu perfil.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="relative" style={{ height: 420 }}>
            {!hasMore && (
              <div className="absolute inset-0 flex items-center justify-center bg-white border border-slate-200 rounded-3xl text-center px-6">
                <div>
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="text-sm font-medium text-slate-800">
                    Has visto todas tus recomendaciones
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Vuelve más tarde cuando se publiquen nuevos temas.
                  </div>
                </div>
              </div>
            )}

            {hasMore && (
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                className="absolute inset-0 bg-white border border-slate-200 rounded-3xl p-6 cursor-grab active:cursor-grabbing select-none touch-none"
                style={{
                  transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
                  transition: dragging.current ? "none" : "transform 0.3s ease",
                }}
              >
                <div
                  className="absolute top-6 left-6 text-emerald-600 border-2 border-emerald-600 rounded-lg px-3 py-1 text-xs font-bold rotate-[-12deg]"
                  style={{ opacity: rightOpacity }}
                >
                  ME INTERESA
                </div>
                <div
                  className="absolute top-6 right-6 text-slate-400 border-2 border-slate-400 rounded-lg px-3 py-1 text-xs font-bold rotate-[12deg]"
                  style={{ opacity: leftOpacity }}
                >
                  PASAR
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand text-white inline-block">
                  {current.matchScore}% afinidad
                </span>

                <div className="text-base font-semibold text-slate-900 mt-4">
                  {current.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {current.tutor?.fullName} · {current.department} · {current.type}
                </div>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {current.description}
                </p>

                {current.skills && current.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {current.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && !error && hasMore && (
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={() => advance("skipped")}
              disabled={sending}
              className="w-14 h-14 rounded-full border border-slate-300 text-slate-500 text-xl hover:bg-slate-100 transition disabled:opacity-60"
              aria-label="Pasar"
            >
              ✕
            </button>
            <button
              onClick={() => advance("interested")}
              disabled={sending}
              className="w-14 h-14 rounded-full bg-brand text-white text-xl hover:bg-brand-dark transition disabled:opacity-60"
              aria-label="Me interesa"
            >
              ♥
            </button>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="text-center text-xs text-slate-400 mt-4">
            {Math.min(index + (hasMore ? 1 : 0), items.length)} / {items.length}
          </div>
        )}
      </div>
    </div>
  );
}