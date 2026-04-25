"use client";

import { create } from "zustand";
import type { ToastType } from "@/components/ui/toast";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

let counter = 0;

/** Dedup key: same type + title within the active toast list = duplicate */
function isDuplicate(toasts: ToastItem[], incoming: Omit<ToastItem, "id">): boolean {
  return toasts.some((t) => t.type === incoming.type && t.title === incoming.title);
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    set((state) => {
      if (isDuplicate(state.toasts, toast)) return state; // suppress duplicate
      const id = `toast-${Date.now()}-${++counter}`;
      return { toasts: [...state.toasts.slice(-4), { ...toast, id }] };
    });
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearAll: () => set({ toasts: [] }),
}));

export function useToast() {
  const { addToast, dismissToast, clearAll } = useToastStore();

  return {
    toast: addToast,
    dismiss: dismissToast,
    clearAll,
    success: (title: string, message?: string) => addToast({ type: "success", title, message }),
    error: (title: string, message?: string) => addToast({ type: "error", title, message }),
    info: (title: string, message?: string) => addToast({ type: "info", title, message }),
    warning: (title: string, message?: string) => addToast({ type: "warning", title, message }),
  };
}
