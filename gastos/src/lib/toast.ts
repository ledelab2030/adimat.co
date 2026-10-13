import { signal } from '@preact/signals';

export interface ToastState {
  id: number;
  message: string;
  undo?: () => void | Promise<void>;
}

export const toast = signal<ToastState | null>(null);
let counter = 0;
let hideHandle: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, undo?: () => void | Promise<void>, durationMs = 5000) {
  const id = ++counter;
  toast.value = { id, message, undo };
  if (hideHandle) clearTimeout(hideHandle);
  hideHandle = setTimeout(() => {
    if (toast.value?.id === id) toast.value = null;
  }, durationMs);
}

export function dismissToast() {
  toast.value = null;
  if (hideHandle) clearTimeout(hideHandle);
}
