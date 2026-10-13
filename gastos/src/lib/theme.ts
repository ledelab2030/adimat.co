import { effect } from '@preact/signals';
import { settings } from './store';

let initialized = false;

export function initTheme(): void {
  if (initialized) return;
  initialized = true;

  const mediaQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function apply() {
    const mode = settings.value.theme;
    const isDark = mode === 'dark' || (mode === 'auto' && (mediaQuery?.matches ?? false));
    document.documentElement.classList.toggle('dark', isDark);
  }

  effect(() => {
    settings.value.theme;
    apply();
  });

  mediaQuery?.addEventListener('change', apply);
}
