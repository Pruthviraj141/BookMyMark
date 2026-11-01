import React, { useEffect } from 'react';

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, onClose, children }) => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {children}
    </div>
  );
};

export const AlertDialogBackdrop: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="fixed inset-0 bg-black/65 backdrop-blur-sm animate-fade-in"
    />
  );
};

export const AlertDialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`relative z-10 w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col animate-scale-in ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertDialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`pb-3 font-semibold text-base text-foreground ${className}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDialogBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`text-xs text-muted-foreground leading-relaxed py-1 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`pt-5 flex items-center justify-end gap-2.5 ${className}`} {...props}>
      {children}
    </div>
  );
};
