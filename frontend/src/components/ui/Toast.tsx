import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const item: ToastItem = { id, title, description, variant, duration };

    setToasts((prev) => [item, ...prev]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const contextValue = useMemo(() => ({ toast, removeToast }), [toast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container floating near top of screen */}
      <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm mx-auto pt-[env(safe-area-inset-top)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-xl animate-slide-up transition-all ${
              t.variant === 'success'
                ? 'bg-card/95 border-emerald-500/40 text-foreground'
                : t.variant === 'error'
                ? 'bg-card/95 border-destructive/50 text-foreground'
                : t.variant === 'warning'
                ? 'bg-card/95 border-amber-500/40 text-foreground'
                : 'bg-card/95 border-border text-foreground'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.variant === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : t.variant === 'error' ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : t.variant === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              ) : (
                <Info className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs font-semibold text-foreground tracking-tight">{t.title}</p>
              {t.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground active:scale-95 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
