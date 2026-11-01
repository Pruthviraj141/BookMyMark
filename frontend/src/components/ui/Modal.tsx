import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {children}
    </div>
  );
};

export const ModalBackdrop: React.FC<{ onClick?: () => void; className?: string }> = ({
  onClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in ${className}`}
    />
  );
};

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const ModalContent: React.FC<ModalContentProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`relative z-10 w-full max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up sm:animate-scale-in pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const ModalHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  );
};

export const ModalCloseButton: React.FC<{ onClick: () => void; className?: string }> = ({
  onClick,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer ${className}`}
      aria-label="Close modal"
    >
      <X className="w-5 h-5" />
    </button>
  );
};

export const ModalBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => {
  return (
    <div className={`py-4 overflow-y-auto flex-grow ${className}`} {...props}>
      {children}
    </div>
  );
};

export const ModalFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => {
  return (
    <div className={`pt-4 border-t border-border flex items-center justify-end gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
};
