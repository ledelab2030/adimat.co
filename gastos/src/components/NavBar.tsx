import { PRIMARY_VIEWS, SECONDARY_VIEWS, currentView, goTo } from '../lib/nav';

function NavButton(props: { id: typeof PRIMARY_VIEWS[number]['id']; label: string; icon: string; vertical?: boolean }) {
  const active = currentView.value === props.id;
  return (
    <button
      onClick={() => goTo(props.id)}
      aria-current={active ? 'page' : undefined}
      className={`tap-target flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-medium transition ${
        active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
      } ${props.vertical ? 'flex-row justify-start gap-3 px-3' : ''}`}
    >
      <span className={props.vertical ? 'text-xl' : 'text-xl'} aria-hidden="true">
        {props.icon}
      </span>
      <span>{props.label}</span>
    </button>
  );
}

export function MobileNav() {
  const isMas = SECONDARY_VIEWS.some((v) => v.id === currentView.value);
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95"
      aria-label="Navegacion principal"
    >
      {PRIMARY_VIEWS.map((v) => (
        <NavButton key={v.id} id={v.id} label={v.label} icon={v.icon} />
      ))}
      <button
        onClick={() => goTo('mas')}
        aria-current={isMas ? 'page' : undefined}
        className={`tap-target flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-medium ${
          isMas ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <span className="text-xl" aria-hidden="true">
          ☰
        </span>
        <span>Mas</span>
      </button>
    </nav>
  );
}

export function DesktopSidebar() {
  return (
    <nav
      className="safe-top sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-4 md:flex dark:border-slate-800 dark:bg-slate-900"
      aria-label="Navegacion principal"
    >
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="text-2xl" aria-hidden="true">💸</span>
        <span className="text-lg font-bold">Gastos</span>
      </div>
      {[...PRIMARY_VIEWS, ...SECONDARY_VIEWS].map((v) => (
        <NavButton key={v.id} id={v.id} label={v.label} icon={v.icon} vertical />
      ))}
    </nav>
  );
}
