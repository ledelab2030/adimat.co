import type { ButtonHTMLAttributes, ComponentChildren, InputHTMLAttributes, SelectHTMLAttributes } from 'preact';

export function Card(props: { children: ComponentChildren; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-4 ${props.className ?? ''}`}>
      {props.children}
    </div>
  );
}

export function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    children: ComponentChildren;
  }
) {
  const { variant = 'primary', className, children, ...rest } = props;
  const base = 'tap-target inline-flex items-center justify-center gap-2 rounded-xl px-4 font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  const variants: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  return (
    <button className={`${base} ${variants[variant]} ${className ?? ''}`} {...rest}>
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label, id, className, ...rest } = props;
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <input
        id={id}
        className={`tap-target w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base focus:border-brand-500 ${className ?? ''}`}
        {...rest}
      />
    </label>
  );
}

export function Select(
  props: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ComponentChildren }
) {
  const { label, children, className, ...rest } = props;
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <select
        className={`tap-target w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base focus:border-brand-500 ${className ?? ''}`}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

export function ProgressBar(props: { pct: number; level?: 'ok' | 'warning' | 'over' }) {
  const level = props.level ?? (props.pct >= 100 ? 'over' : props.pct >= 80 ? 'warning' : 'ok');
  const colors: Record<string, string> = {
    ok: 'bg-brand-500',
    warning: 'bg-amber-500',
    over: 'bg-red-600'
  };
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(props.pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${colors[level]} transition-all`} style={{ width: `${Math.min(100, Math.max(0, props.pct))}%` }} />
    </div>
  );
}

export function IconBadge(props: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-base', md: 'h-11 w-11 text-xl', lg: 'h-14 w-14 text-2xl' };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${sizes[props.size ?? 'md']}`}
      style={{ backgroundColor: `${props.color}22`, color: props.color }}
      aria-hidden="true"
    >
      {props.icon}
    </span>
  );
}

export function BarRow(props: { label: string; amount: string; pct: number; color?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{props.label}</span>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">{props.amount}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(2, props.pct))}%`, backgroundColor: props.color ?? '#20a870' }}
        />
      </div>
    </div>
  );
}

export function EmptyState(props: { children: ComponentChildren }) {
  return <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{props.children}</p>;
}
