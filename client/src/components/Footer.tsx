export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-brand-dark">
            TFM<span className="text-brand">io</span>
          </span>
          <span className="text-xs text-slate-400">— ETSIIT, Universidad de Granada</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Trabajo Fin de Máster · Anas Tahir</span>
          <span className="text-slate-300">·</span>
          <span>Tutor: Prof. Miguel García Silvente</span>
        </div>
      </div>
    </footer>
  );
}