import type { ComponentChildren } from 'preact';

export function Modal(props: { title: string; onClose: () => void; children: ComponentChildren }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4" onClick={props.onClose}>
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl md:rounded-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{props.title}</h2>
          <button className="tap-target px-2 text-xl text-slate-500" onClick={props.onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}
