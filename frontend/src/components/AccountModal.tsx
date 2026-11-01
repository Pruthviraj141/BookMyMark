import React from 'react';
import { X, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestLogout: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onRequestLogout
}) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col animate-slide-up sm:animate-scale-in pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-5 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <h2 className="text-sm font-medium text-foreground tracking-tight">Account</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User profile info */}
        <div className="py-4 flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User'}
              className="w-12 h-12 rounded-xl border border-border object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground font-semibold text-base shrink-0">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-grow">
            <span className="text-sm font-medium text-foreground block truncate">
              {user?.name || 'BookMyMark User'}
            </span>
            <span className="text-xs text-muted-foreground truncate block font-mono">
              {user?.email}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono mt-0.5">
              <ShieldCheck className="w-3 h-3 text-foreground" />
              Google Authenticated
            </span>
          </div>
        </div>


        {/* Sign Out Action */}
        <div className="pt-3 border-t border-border mt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestLogout();
            }}
            className="w-full py-2 px-3 rounded-lg border border-border bg-background hover:bg-muted active:scale-98 text-xs font-medium text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
