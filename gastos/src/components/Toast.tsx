import { dismissToast, toast } from '../lib/toast';
import { Button } from './ui';

export function Toast() {
  const t = toast.value;
  if (!t) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-20 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg md:bottom-6"
    >
      <span>{t.message}</span>
      <div className="flex shrink-0 items-center gap-1">
        {t.undo && (
          <Button
            variant="ghost"
            className="h-auto px-2 py-1 text-brand-300 hover:bg-white/10"
            onClick={async () => {
              await t.undo?.();
              dismissToast();
            }}
          >
            Deshacer
          </Button>
        )}
        <button aria-label="Cerrar" className="tap-target px-2 text-white/70" onClick={dismissToast}>
          ✕
        </button>
      </div>
    </div>
  );
}
