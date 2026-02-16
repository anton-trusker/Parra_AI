import React from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface EnhancedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function EnhancedLayout({ children, className }: EnhancedLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="h-full" />
      <main className={cn(
        'flex-1 overflow-hidden',
        'bg-muted/30',
        className
      )}>
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}