import { useEffect, useState } from 'preact/hooks';
import { initStore } from './lib/store';
import { initSync } from './lib/sync';
import { initTheme } from './lib/theme';
import { currentView } from './lib/nav';
import { DesktopSidebar, MobileNav } from './components/NavBar';
import { ConnectivityBadge } from './components/ConnectivityBadge';
import { Toast } from './components/Toast';
import { Registro } from './screens/Registro';
import { Panel } from './screens/Panel';
import { Historial } from './screens/Historial';
import { Mas } from './screens/Mas';
import { Categorias } from './screens/Categorias';
import { Cuentas } from './screens/Cuentas';
import { Recurrentes } from './screens/Recurrentes';
import { Presupuestos } from './screens/Presupuestos';
import { Ajustes } from './screens/Ajustes';

function CurrentScreen() {
  switch (currentView.value) {
    case 'registro':
      return <Registro />;
    case 'panel':
      return <Panel />;
    case 'historial':
      return <Historial />;
    case 'mas':
      return <Mas />;
    case 'categorias':
      return <Categorias />;
    case 'cuentas':
      return <Cuentas />;
    case 'recurrentes':
      return <Recurrentes />;
    case 'presupuestos':
      return <Presupuestos />;
    case 'ajustes':
      return <Ajustes />;
    default:
      return <Registro />;
  }
}

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStore().then(() => {
      initTheme();
      initSync();
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center text-slate-400">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh md:flex-row">
      <DesktopSidebar />
      <div className="flex-1">
        <header className="safe-top sticky top-0 z-10 flex items-center justify-end border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur md:static md:border-0 md:bg-transparent dark:border-slate-800 dark:bg-slate-950/90">
          <ConnectivityBadge />
        </header>
        <main>
          <CurrentScreen />
        </main>
      </div>
      <MobileNav />
      <Toast />
    </div>
  );
}
