"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  description?: string;
}

interface ToastContextType {
  toast: (message: string, options?: { type?: ToastType; description?: string }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options?: { type?: ToastType; description?: string }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const type = options?.type || "info";
      const description = options?.description;

      setToasts((prev) => [...prev, { id, message, type, description }]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        remove(id);
      }, 4000);
    },
    [remove]
  );

  const success = useCallback((msg: string, desc?: string) => toast(msg, { type: "success", description: desc }), [toast]);
  const error = useCallback((msg: string, desc?: string) => toast(msg, { type: "error", description: desc }), [toast]);
  const warning = useCallback((msg: string, desc?: string) => toast(msg, { type: "warning", description: desc }), [toast]);
  const info = useCallback((msg: string, desc?: string) => toast(msg, { type: "info", description: desc }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, remove }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-md flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
  };

  const borders = {
    success: "border-emerald-500/20 dark:border-emerald-500/30",
    error: "border-rose-500/20 dark:border-rose-500/30",
    warning: "border-amber-500/20 dark:border-amber-500/30",
    info: "border-blue-500/20 dark:border-blue-500/30",
  };

  return (
    <div
      className={`pointer-events-auto flex w-80 sm:w-96 overflow-hidden rounded-xl border bg-card/90 p-4 shadow-lg backdrop-blur-md transition-all duration-200 ${
        isExiting
          ? "translate-y-2 scale-95 opacity-0"
          : "animate-in slide-in-from-bottom-2 fade-in"
      } ${borders[toast.type]}`}
      role="alert"
    >
      <div className="flex w-full items-start gap-3">
        {icons[toast.type]}
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-medium text-foreground leading-tight">{toast.message}</h4>
          {toast.description && (
            <p className="text-xs text-muted-foreground leading-normal">{toast.description}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          aria-label="Dismiss toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
