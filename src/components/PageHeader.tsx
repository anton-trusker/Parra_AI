import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, actions, backButton }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {backButton}
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
