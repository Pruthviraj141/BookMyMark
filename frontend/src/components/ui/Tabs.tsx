import React, { createContext, useContext } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  value: '',
  onValueChange: () => {}
});

export interface TabsProps {
  value: string;
  onValueChange: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, className = '', children }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`flex flex-col w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 bg-muted rounded-2xl border border-border/50 gap-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ value, className = '', children, ...props }) => {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all select-none cursor-pointer ${
        isActive
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
