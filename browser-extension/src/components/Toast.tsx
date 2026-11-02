import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="px-3 py-1.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg flex items-center gap-1.5 text-[11px] font-medium tracking-tight">
        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
        <span>{message}</span>
      </div>
    </div>
  );
};
