import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CompactThemeContextType {
  isCompact: boolean;
  setIsCompact: (compact: boolean) => void;
  toggleCompact: () => void;
}

const CompactThemeContext = createContext<CompactThemeContextType | undefined>(undefined);

export function useCompactTheme() {
  const context = useContext(CompactThemeContext);
  if (context === undefined) {
    throw new Error('useCompactTheme must be used within a CompactThemeProvider');
  }
  return context;
}

interface CompactThemeProviderProps {
  children: React.ReactNode;
  defaultCompact?: boolean;
  persistKey?: string;
}

export function CompactThemeProvider({ 
  children, 
  defaultCompact = false,
  persistKey = 'compact-theme-enabled'
}: CompactThemeProviderProps) {
  const [isCompact, setIsCompact] = useState(defaultCompact);

  // Load persisted preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const persisted = localStorage.getItem(persistKey);
      if (persisted !== null) {
        setIsCompact(JSON.parse(persisted));
      }
    }
  }, [persistKey]);

  // Persist preference when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(persistKey, JSON.stringify(isCompact));
    }
  }, [isCompact, persistKey]);

  // Apply compact class to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isCompact) {
        document.documentElement.classList.add('compact');
      } else {
        document.documentElement.classList.remove('compact');
      }
    }
  }, [isCompact]);

  const toggleCompact = () => {
    setIsCompact(prev => !prev);
  };

  const value = {
    isCompact,
    setIsCompact,
    toggleCompact,
  };

  return (
    <CompactThemeContext.Provider value={value}>
      <div className={cn(
        'transition-all duration-200',
        isCompact && 'compact'
      )}>
        {children}
      </div>
    </CompactThemeContext.Provider>
  );
}

// Compact theme toggle component
interface CompactThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function CompactThemeToggle({ 
  className,
  size = 'sm',
  showLabel = true 
}: CompactThemeToggleProps) {
  const { isCompact, toggleCompact } = useCompactTheme();

  const sizeClasses = {
    sm: 'h-6 px-2 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  return (
    <button
      onClick={toggleCompact}
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-input bg-background',
        'hover:bg-accent hover:text-accent-foreground transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        sizeClasses[size],
        isCompact && 'bg-accent text-accent-foreground',
        className
      )}
      aria-pressed={isCompact}
      aria-label="Toggle compact theme"
    >
      <span className={cn(
        'inline-block w-2 h-2 rounded-full transition-colors',
        isCompact ? 'bg-current' : 'bg-muted-foreground'
      )} />
      {showLabel && (
        <span className="font-medium">
          {isCompact ? 'Compact' : 'Normal'}
        </span>
      )}
    </button>
  );
}

// Compact-aware component wrapper
interface CompactAwareProps {
  children: React.ReactNode;
  className?: string;
  fallbackClassName?: string;
}

export function CompactAware({ 
  children, 
  className,
  fallbackClassName = 'text-sm'
}: CompactAwareProps) {
  const { isCompact } = useCompactTheme();
  
  return (
    <div className={cn(
      className,
      !className && (isCompact ? 'text-xs' : fallbackClassName)
    )}>
      {children}
    </div>
  );
}