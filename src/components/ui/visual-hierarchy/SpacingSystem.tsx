import React from 'react';
import { cn } from '@/lib/utils';

interface SpacingSystemProps {
  children: React.ReactNode;
  className?: string;
}

// Base spacing scale (4px grid system)
export const spacing = {
  0: '0rem',      // 0px
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const;

export type SpacingSize = keyof typeof spacing;

interface StackProps extends SpacingSystemProps {
  spacing?: SpacingSize;
  direction?: 'vertical' | 'horizontal';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
}

export function Stack({
  children,
  spacing = 4,
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
}: StackProps) {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        `gap-${spacing}`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface ContainerProps extends SpacingSystemProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  center?: boolean;
}

export function Container({
  children,
  size = 'lg',
  center = true,
  className,
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none',
  };

  return (
    <div
      className={cn(
        'w-full',
        center && 'mx-auto',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}

interface SectionProps extends SpacingSystemProps {
  spacing?: SpacingSize;
  background?: 'transparent' | 'subtle' | 'accent';
  border?: boolean;
  rounded?: boolean;
}

export function Section({
  children,
  spacing = 6,
  background = 'transparent',
  border = false,
  rounded = false,
  className,
}: SectionProps) {
  const backgroundClasses = {
    transparent: '',
    subtle: 'bg-muted/30',
    accent: 'bg-accent/10',
  };

  return (
    <section
      className={cn(
        'w-full',
        `p-${spacing}`,
        backgroundClasses[background],
        border && 'border border-border',
        rounded && 'rounded-lg',
        className
      )}
    >
      {children}
    </section>
  );
}

interface CardGroupProps extends SpacingSystemProps {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  spacing?: SpacingSize;
  equalHeight?: boolean;
}

export function CardGroup({
  children,
  columns = 1,
  spacing = 4,
  equalHeight = true,
  className,
}: CardGroupProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div
      className={cn(
        'grid',
        gridCols[columns],
        `gap-${spacing}`,
        equalHeight && 'items-stretch',
        className
      )}
    >
      {children}
    </div>
  );
}

interface DividerProps {
  spacing?: SpacingSize;
  color?: 'default' | 'subtle' | 'accent';
  thickness?: 'thin' | 'normal' | 'thick';
}

export function Divider({
  spacing = 4,
  color = 'default',
  thickness = 'normal',
}: DividerProps) {
  const colorClasses = {
    default: 'border-border',
    subtle: 'border-border/50',
    accent: 'border-accent/30',
  };

  const thicknessClasses = {
    thin: 'border-t',
    normal: 'border-t-2',
    thick: 'border-t-4',
  };

  return (
    <hr
      className={cn(
        `my-${spacing}`,
        colorClasses[color],
        thicknessClasses[thickness],
        'border-solid'
      )}
    />
  );
}

interface InlineProps extends SpacingSystemProps {
  spacing?: SpacingSize;
  align?: 'baseline' | 'center' | 'start' | 'end';
}

export function Inline({
  children,
  spacing = 2,
  align = 'center',
  className,
}: InlineProps) {
  const alignClasses = {
    baseline: 'items-baseline',
    center: 'items-center',
    start: 'items-start',
    end: 'items-end',
  };

  return (
    <div
      className={cn(
        'flex flex-wrap',
        alignClasses[align],
        `gap-${spacing}`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface ClusterProps extends SpacingSystemProps {
  spacing?: SpacingSize;
  justify?: 'start' | 'center' | 'end' | 'between';
}

export function Cluster({
  children,
  spacing = 2,
  justify = 'start',
  className,
}: ClusterProps) {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center',
        justifyClasses[justify],
        `gap-${spacing}`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface SidebarLayoutProps extends SpacingSystemProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  sidebarWidth?: 'sm' | 'md' | 'lg' | 'xl';
  gap?: SpacingSize;
}

export function SidebarLayout({
  sidebar,
  main,
  sidebarWidth = 'md',
  gap = 6,
  className,
}: SidebarLayoutProps) {
  const widthClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
    xl: 'w-96',
  };

  return (
    <div
      className={cn(
        'flex',
        `gap-${gap}`,
        className
      )}
    >
      <aside className={cn('flex-shrink-0', widthClasses[sidebarWidth])}>
        {sidebar}
      </aside>
      <main className="flex-1 min-w-0">
        {main}
      </main>
    </div>
  );
}

// Spacing utility functions for dynamic spacing
export function getSpacingClass(size: SpacingSize, property: 'm' | 'p' | 'gap' | 'space') {
  return `${property}-${size}`;
}

export function getDirectionalSpacingClass(
  size: SpacingSize,
  property: 'm' | 'p',
  direction: 't' | 'b' | 'l' | 'r' | 'x' | 'y'
) {
  return `${property}${direction}-${size}`;
}

// Responsive spacing helpers
export const responsiveSpacing = {
  mobile: {
    stack: 3,
    section: 4,
    card: 3,
    inline: 2,
  },
  tablet: {
    stack: 4,
    section: 6,
    card: 4,
    inline: 3,
  },
  desktop: {
    stack: 6,
    section: 8,
    card: 6,
    inline: 4,
  },
} as const;