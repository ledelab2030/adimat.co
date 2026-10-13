import { SECONDARY_VIEWS, goTo } from '../lib/nav';
import { Card } from '../components/ui';

export function Mas() {
  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 pb-28 md:pb-10">
      <h1 className="text-lg font-bold">Mas</h1>
      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {SECONDARY_VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => goTo(v.id)}
            className="tap-target flex w-full items-center gap-3 py-3 text-left"
          >
            <span className="text-xl" aria-hidden="true">{v.icon}</span>
            <span className="flex-1 font-medium">{v.label}</span>
            <span className="text-slate-400" aria-hidden="true">›</span>
          </button>
        ))}
      </Card>
    </div>
  );
}
