import React from 'react';
import { cn } from '@/lib/utils';

// Typography scale based on 4px grid system
export const typography = {
  // Display sizes
  display: {
    xl: 'text-6xl leading-tight font-bold',
    lg: 'text-5xl leading-tight font-bold',
    md: 'text-4xl leading-tight font-bold',
    sm: 'text-3xl leading-tight font-bold',
  },
  
  // Heading sizes
  heading: {
    xl: 'text-2xl leading-snug font-semibold',
    lg: 'text-xl leading-snug font-semibold',
    md: 'text-lg leading-snug font-semibold',
    sm: 'text-base leading-snug font-semibold',
    xs: 'text-sm leading-snug font-semibold',
  },
  
  // Body text sizes
  body: {
    xl: 'text-lg leading-relaxed',
    lg: 'text-base leading-relaxed',
    md: 'text-sm leading-relaxed',
    sm: 'text-xs leading-relaxed',
  },
  
  // UI text sizes
  ui: {
    xl: 'text-base leading-normal font-medium',
    lg: 'text-sm leading-normal font-medium',
    md: 'text-sm leading-normal',
    sm: 'text-xs leading-normal',
    xs: 'text-[11px] leading-normal',
  },
  
  // Compact sizes for dense interfaces
  compact: {
    xl: 'text-base leading-tight',
    lg: 'text-sm leading-tight',
    md: 'text-xs leading-tight',
    sm: 'text-[11px] leading-tight',
    xs: 'text-[10px] leading-tight',
  },
} as const;

export type TypographySize = 'xl' | 'lg' | 'md' | 'sm' | 'xs';
export type TypographyVariant = 'display' | 'heading' | 'body' | 'ui' | 'compact';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  size?: TypographySize;
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'subtle' | 'accent' | 'success' | 'warning' | 'error';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  as?: React.ElementType;
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  size = 'md',
  weight,
  color = 'default',
  align = 'left',
  truncate = false,
  as: Component = 'p',
  className,
  children,
  ...props
}: TextProps) {
  const colorClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    subtle: 'text-muted-foreground/70',
    accent: 'text-accent-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const baseClass = typography[variant][size];
  const weightClass = weight ? weightClasses[weight] : '';

  return (
    <Component
      className={cn(
        baseClass,
        weightClass,
        colorClasses[color],
        alignClasses[align],
        truncate && 'truncate',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

interface HeadingProps extends Omit<TextProps, 'variant'> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Heading({
  level = 2,
  size,
  weight = 'semibold',
  className,
  children,
  ...props
}: HeadingProps) {
  const sizeMap = {
    1: 'xl',
    2: 'lg',
    3: 'md',
    4: 'sm',
    5: 'xs',
    6: 'xs',
  } as const;

  const as = `h${level}` as React.ElementType;
  const finalSize = size || sizeMap[level];

  return (
    <Text
      variant="heading"
      size={finalSize}
      weight={weight}
      as={as}
      className={cn('scroll-m-20', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

interface DisplayProps extends Omit<TextProps, 'variant'> {
  size?: 'xl' | 'lg' | 'md' | 'sm';
}

export function Display({
  size = 'lg',
  weight = 'bold',
  className,
  children,
  ...props
}: DisplayProps) {
  return (
    <Text
      variant="display"
      size={size}
      weight={weight}
      className={cn('tracking-tight', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

interface CaptionProps extends Omit<TextProps, 'variant' | 'size'> {
  size?: 'sm' | 'xs';
}

export function Caption({
  size = 'xs',
  color = 'muted',
  className,
  children,
  ...props
}: CaptionProps) {
  return (
    <Text
      variant="ui"
      size={size}
      color={color}
      className={cn('uppercase tracking-wider', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

interface LabelProps extends Omit<TextProps, 'variant' | 'size'> {
  required?: boolean;
  htmlFor?: string;
}

export function Label({
  size = 'sm',
  weight = 'medium',
  color = 'default',
  required = false,
  htmlFor,
  className,
  children,
  ...props
}: LabelProps) {
  return (
    <Text
      as="label"
      variant="ui"
      size={size}
      weight={weight}
      color={color}
      htmlFor={htmlFor}
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500" aria-hidden="true">*</span>
      )}
    </Text>
  );
}

interface HelperTextProps extends Omit<TextProps, 'variant' | 'size'> {
  size?: 'sm' | 'xs';
}

export function HelperText({
  size = 'xs',
  color = 'muted',
  className,
  children,
  ...props
}: HelperTextProps) {
  return (
    <Text
      variant="ui"
      size={size}
      color={color}
      className={cn('mt-1', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

// Layout components for visual hierarchy
interface ContentBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'transparent' | 'subtle' | 'accent';
  border?: boolean;
  rounded?: boolean;
}

export function ContentBlock({
  spacing = 'md',
  background = 'transparent',
  border = false,
  rounded = false,
  className,
  children,
  ...props
}: ContentBlockProps) {
  const spacingClasses = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const backgroundClasses = {
    transparent: '',
    subtle: 'bg-muted/30',
    accent: 'bg-accent/10',
  };

  return (
    <div
      className={cn(
        spacingClasses[spacing],
        backgroundClasses[background],
        border && 'border border-border',
        rounded && 'rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface ContentGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'xs' | 'sm' | 'md' | 'lg';
  divider?: boolean;
}

export function ContentGroup({
  spacing = 'md',
  divider = false,
  className,
  children,
  ...props
}: ContentGroupProps) {
  const spacingClasses = {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  return (
    <div
      className={cn(
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        if (divider && index > 0) {
          return (
            <React.Fragment key={index}>
              <hr className="border-border/50" />
              {child}
            </React.Fragment>
          );
        }
        
        return child;
      })}
    </div>
  );
}

// Responsive text utilities
export const responsiveText = {
  display: {
    mobile: 'text-4xl',
    tablet: 'text-5xl',
    desktop: 'text-6xl',
  },
  heading: {
    mobile: 'text-xl',
    tablet: 'text-2xl',
    desktop: 'text-3xl',
  },
  body: {
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-base',
  },
  ui: {
    mobile: 'text-xs',
    tablet: 'text-sm',
    desktop: 'text-sm',
  },
} as const;