import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

type Phase = "none" | "waiting" | "reminder" | "overdue";
type PanelKind = "extend" | "close";

interface MissingGrader {
  id: string;
  name: string;
  role: "tutor" | "jury";
}

interface PendingItem {
  workId: string;
  studentName: string;
  tutorName: string;
  defenseDate?: string;
  deadline: string | null;
  phase: Phase;
  extraDays: number;
  receivedCount: number;
  missing: MissingGrader[];
}

interface Notice {
  text: string;
  showGradesLink?: boolean;
}

const MAX_EXTRA_DAYS = 30;
const MIN_REASON = 10;
const MAX_REASON = 500;

const phaseBadge: Record<Phase, { label: string; className: string }> = {
  overdue: { label: "Plazo vencido", className: "bg-red-50 text-red-700" },
  reminder: { label: "Vence pronto", className: "bg-amber-50 text-amber-700" },
  waiting: { label: "En plazo", className: "bg-emerald-50 text-emerald-700" },
  none: { label: "Sin fecha de defensa", className: "bg-slate-100 text-slate-500" },
};

/** Dates are stored in UTC, so they are shown in UTC to keep the same day. */
function formatDay(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function errorText(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback
  );
}

export default function PendingGrades() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const [panel, setPanel] = useState<Record<string, PanelKind | null>>({});
  const [daysInput, setDaysInput] = useState<Record<string, string>>({});
  const [reasonInput, setReasonInput] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [cardError, setCardError] = useState<Record<string, string>>({});

  async function load() {
    try {
      const res = await api.get<{ works: PendingItem[] }>("/pending-grades");
      setItems(res.data.works);
      setLoadError("");
    } catch {
      setLoadError("No se pudieron cargar los trabajos pendientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function togglePanel(id: string, kind: PanelKind) {
    setCardError((e) => ({ ...e, [id]: "" }));
    setPanel((p) => ({ ...p, [id]: p[id] === kind ? null : kind }));
  }

  async function handleExtend(item: PendingItem) {
    const id = item.workId;
    const days = Number((daysInput[id] ?? "7").trim());

    if (!Number.isInteger(days) || days < 1 || days > MAX_EXTRA_DAYS) {
      setCardError((e) => ({
        ...e,
        [id]: `Indica un número entero de días entre 1 y ${MAX_EXTRA_DAYS}`,
      }));
      return;
    }

    setBusy((b) => ({ ...b, [id]: true }));
    setCardError((e) => ({ ...e, [id]: "" }));
    try {
      const res = await api.patch<{
        extraDays: number;
        deadline: string;
        phase: Phase;
        notified: number;
      }>(`/pending-grades/${id}/extend`, { days });

      setNotice({
        text: `Plazo ampliado para el trabajo de ${item.studentName}: los evaluadores tienen ahora hasta el ${formatDay(res.data.deadline)}. Se avisó a ${res.data.notified} ${res.data.notified === 1 ? "persona" : "personas"}.`,
      });
      setPanel((p) => ({ ...p, [id]: null }));
      await load();
    } catch (err) {
      setCardError((e) => ({ ...e, [id]: errorText(err, "No se pudo ampliar el plazo") }));
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }

  async function handleClose(item: PendingItem) {
    const id = item.workId;
    const reason = (reasonInput[id] ?? "").trim();

    if (reason.length < MIN_REASON) {
      setCardError((e) => ({
        ...e,
        [id]: `El motivo debe tener al menos ${MIN_REASON} caracteres`,
      }));
      return;
    }
    if (reason.length > MAX_REASON) {
      setCardError((e) => ({
        ...e,
        [id]: `El motivo no puede superar los ${MAX_REASON} caracteres`,
      }));
      return;
    }

    setBusy((b) => ({ ...b, [id]: true }));
    setCardError((e) => ({ ...e, [id]: "" }));
    try {
      const res = await api.post<{ finalGrade: number; missing: string[]; receivedCount: number }>(
        `/pending-grades/${id}/close`,
        { reason }
      );

      setItems((prev) => prev.filter((w) => w.workId !== id));
      setNotice({
        text: `Calificación cerrada para ${item.studentName}: nota final ${res.data.finalGrade.toFixed(2)}, calculada con ${res.data.receivedCount} ${res.data.receivedCount === 1 ? "evaluación" : "evaluaciones"}. Falta publicarla para que el estudiante la vea.`,
        showGradesLink: true,
      });
    } catch (err) {
      setCardError((e) => ({ ...e, [id]: errorText(err, "No se pudo cerrar la calificación") }));
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }

  const primaryButton =
    "text-xs px-4 py-2 rounded-lg bg-brand-dark text-white font-medium hover:opacity-90 transition disabled:opacity-60";
  const outlineButton =
    "text-xs px-4 py-2 rounded-lg border border-brand text-brand font-medium hover:bg-brand-light transition disabled:opacity-40 disabled:cursor-not-allowed";
  const plainButton =
    "text-xs px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition";

  return (
    <div className="px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Calificaciones pendientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Trabajos defendidos a los que aún les faltan calificaciones. Puedes dar más días a los
            evaluadores o cerrar la nota con las calificaciones recibidas.
          </p>
        </div>

        {notice && (
          <div className="mb-4 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {notice.text}{" "}
            {notice.showGradesLink && (
              <Link to="/coordinator/grades" className="font-medium underline">
                Ir a Calificaciones
              </Link>
            )}
          </div>
        )}

        {loading && <div className="text-sm text-slate-500">Cargando…</div>}
        {loadError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {loadError}
          </div>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">
            No hay trabajos esperando calificaciones.
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => {
            const id = item.workId;
            const badge = phaseBadge[item.phase];
            const total = item.receivedCount + item.missing.length;
            const open = panel[id] ?? null;
            const isBusy = Boolean(busy[id]);
            const canClose = item.receivedCount > 0;

            return (
              <div key={id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{item.studentName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Tutor: {item.tutorName} · Defensa: {formatDay(item.defenseDate)}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div>
                    Plazo para calificar:{" "}
                    <span className="text-slate-800">{formatDay(item.deadline)}</span>
                    {item.extraDays > 0 && (
                      <span className="text-slate-400"> (incluye {item.extraDays} días extra)</span>
                    )}
                  </div>
                  <div>
                    Calificaciones recibidas:{" "}
                    <span className="text-slate-800">
                      {item.receivedCount} de {total}
                    </span>
                  </div>
                  {item.missing.length > 0 && (
                    <div>
                      Faltan:{" "}
                      <span className="text-slate-800">
                        {item.missing
                          .map((m) => `${m.name} (${m.role === "tutor" ? "tutor" : "tribunal"})`)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => togglePanel(id, "extend")}
                    disabled={isBusy}
                    className={primaryButton}
                  >
                    Dar más días
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePanel(id, "close")}
                    disabled={isBusy || !canClose}
                    className={outlineButton}
                  >
                    Cerrar con las notas recibidas
                  </button>
                </div>

                {!canClose && (
                  <div className="text-[11px] text-slate-400 mt-2">
                    Todavía no hay ninguna calificación, así que no se puede cerrar.
                  </div>
                )}

                {open === "extend" && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <label className="text-xs text-slate-500 mb-1 block">
                      Días extra (de 1 a {MAX_EXTRA_DAYS})
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={MAX_EXTRA_DAYS}
                        value={daysInput[id] ?? "7"}
                        onChange={(e) => setDaysInput((d) => ({ ...d, [id]: e.target.value }))}
                        className="w-24 text-sm border border-slate-300 rounded-lg px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => handleExtend(item)}
                        disabled={isBusy}
                        className={primaryButton}
                      >
                        {isBusy ? "Ampliando…" : "Ampliar plazo"}
                      </button>
                      <button type="button" onClick={() => togglePanel(id, "extend")} className={plainButton}>
                        Cancelar
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Se suman a los días que ya tiene el trabajo. Las personas que faltan recibirán
                      un aviso con la nueva fecha.
                    </p>
                  </div>
                )}

                {open === "close" && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-600 mb-2">
                      La nota final se calculará solo con las calificaciones recibidas. Quedará
                      registrado quién faltó y el motivo que escribas.
                    </p>
                    <label className="text-xs text-slate-500 mb-1 block">Motivo del cierre</label>
                    <textarea
                      rows={3}
                      value={reasonInput[id] ?? ""}
                      onChange={(e) => setReasonInput((r) => ({ ...r, [id]: e.target.value }))}
                      placeholder="Ej.: el miembro del tribunal no pudo calificar por motivos de salud"
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                    />
                    <div className="text-[11px] text-slate-400 text-right mb-2">
                      {(reasonInput[id] ?? "").length} / {MAX_REASON}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleClose(item)}
                        disabled={isBusy}
                        className={primaryButton}
                      >
                        {isBusy ? "Cerrando…" : "Cerrar y calcular la nota"}
                      </button>
                      <button type="button" onClick={() => togglePanel(id, "close")} className={plainButton}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {cardError[id] && (
                  <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {cardError[id]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}