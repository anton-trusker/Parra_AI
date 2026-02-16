import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Breakpoint definitions
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

interface ResponsiveContainerProps extends ResponsiveLayoutProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  center?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({
  children,
  maxWidth = 'lg',
  center = true,
  padding = 'md',
  className,
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-none',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
  };

  return (
    <div
      className={cn(
        'w-full',
        center && 'mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps extends ResponsiveLayoutProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

export function ResponsiveGrid({
  children,
  cols = 1,
  gap = 'md',
  responsive = true,
  className,
}: ResponsiveGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const responsiveCols = responsive ? {
    1: 'grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-3 lg:grid-cols-5',
    6: 'sm:grid-cols-3 lg:grid-cols-6',
    12: 'sm:grid-cols-6 lg:grid-cols-12',
  }[cols] : gridCols[cols];

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12',
  };

  return (
    <div
      className={cn(
        'grid',
        responsiveCols,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveSidebarProps extends ResponsiveLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  sidebarWidth?: 'sm' | 'md' | 'lg' | 'xl';
  breakpoint?: Breakpoint;
  gap?: 'sm' | 'md' | 'lg';
  sidebarPosition?: 'left' | 'right';
}

export function ResponsiveSidebar({
  sidebar,
  main,
  sidebarWidth = 'md',
  breakpoint = 'lg',
  gap = 'md',
  sidebarPosition = 'left',
  className,
}: ResponsiveSidebarProps) {
  const widthClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
    xl: 'w-96',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const breakpointPrefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
  const flexDirection = sidebarPosition === 'left' ? 'row' : 'row-reverse';

  return (
    <div
      className={cn(
        'flex',
        `${breakpointPrefix}flex-${flexDirection}`,
        'flex-col',
        gapClasses[gap],
        className
      )}
    >
      <aside
        className={cn(
          'flex-shrink-0',
          `${breakpointPrefix}${widthClasses[sidebarWidth]}`,
          'w-full',
          'order-1',
          sidebarPosition === 'left' ? `${breakpointPrefix}order-1` : `${breakpointPrefix}order-2`
        )}
      >
        {sidebar}
      </aside>
      <main
        className={cn(
          'flex-1 min-w-0',
          'order-2',
          sidebarPosition === 'left' ? `${breakpointPrefix}order-2` : `${breakpointPrefix}order-1`
        )}
      >
        {main}
      </main>
    </div>
  );
}

interface ResponsiveStackProps extends ResponsiveLayoutProps {
  direction?: 'vertical' | 'horizontal';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  responsive?: boolean;
}

export function ResponsiveStack({
  children,
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  responsive = true,
  className,
}: ResponsiveStackProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  const directionClass = direction === 'vertical' ? 'flex-col' : 'flex-row';
  const responsiveDirection = responsive ? `sm:${directionClass}` : directionClass;

  return (
    <div
      className={cn(
        'flex',
        responsive ? 'flex-col' : directionClass,
        responsiveDirection,
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveCardProps extends ResponsiveLayoutProps {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export function ResponsiveCard({
  children,
  padding = 'md',
  shadow = 'sm',
  rounded = 'md',
  className,
}: ResponsiveCardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-12',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'bg-card text-card-foreground',
        paddingClasses[padding],
        shadowClasses[shadow],
        roundedClasses[rounded],
        'border',
        className
      )}
    >
      {children}
    </div>
  );
}

// Responsive visibility utilities
interface ResponsiveVisibilityProps extends ResponsiveLayoutProps {
  show?: Breakpoint[];
  hide?: Breakpoint[];
}

export function ResponsiveVisibility({
  children,
  show = [],
  hide = [],
  className,
}: ResponsiveVisibilityProps) {
  const visibilityClasses = [];

  // Handle show breakpoints
  show.forEach(breakpoint => {
    if (breakpoint === 'xs') {
      visibilityClasses.push('block');
    } else {
      visibilityClasses.push(`${breakpoint}:block`);
      visibilityClasses.push('hidden');
    }
  });

  // Handle hide breakpoints
  hide.forEach(breakpoint => {
    if (breakpoint === 'xs') {
      visibilityClasses.push('hidden');
    } else {
      visibilityClasses.push(`${breakpoint}:hidden`);
    }
  });

  return (
    <div className={cn(visibilityClasses, className)}>
      {children}
    </div>
  );
}

// Responsive text utilities
interface ResponsiveTextProps extends ResponsiveLayoutProps {
  size?: {
    xs?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    xl?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  };
}

export function ResponsiveText({
  children,
  size = { base: 'base' },
  className,
}: ResponsiveTextProps) {
  const textClasses = [];

  Object.entries(size).forEach(([breakpoint, textSize]) => {
    const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
    textClasses.push(`${prefix}text-${textSize}`);
  });

  return (
    <div className={cn(textClasses, className)}>
      {children}
    </div>
  );
}

// Hook for responsive behavior
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xl');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 640) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 1024) setBreakpoint('md');
      else if (width < 1280) setBreakpoint('lg');
      else if (width < 1536) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  };
}