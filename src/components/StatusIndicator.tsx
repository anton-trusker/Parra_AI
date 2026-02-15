import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'neutral';
  label: string;
  detail?: string;
  className?: string;
}

const statusStyles = {
  success: 'border-l-[hsl(var(--wine-success))] bg-[hsl(var(--wine-success))]/5',
  warning: 'border-l-[hsl(var(--wine-warning))] bg-[hsl(var(--wine-warning))]/5',
  error: 'border-l-destructive bg-destructive/5',
  neutral: 'border-l-muted-foreground bg-muted/50',
};

const dotStyles = {
  success: 'bg-[hsl(var(--wine-success))]',
  warning: 'bg-[hsl(var(--wine-warning))]',
  error: 'bg-destructive',
  neutral: 'bg-muted-foreground',
};

export default function StatusIndicator({ status, label, detail, className }: StatusIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 border border-border/50', statusStyles[status], className)}>
      <div className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', dotStyles[status])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {detail && <p className="text-xs text-muted-foreground truncate">{detail}</p>}
      </div>
    </div>
  );
}
