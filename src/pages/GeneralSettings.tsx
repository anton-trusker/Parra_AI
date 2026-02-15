import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Ruler } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CollapsibleSection from '@/components/CollapsibleSection';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSetting, useUpdateAppSetting } from '@/hooks/useAppSettings';

export default function GeneralSettings() {
  const { user } = useAuthStore();

  const { data: openedBottleUnit = 'fraction', isLoading: loadingUnit } = useAppSetting<string>('opened_bottle_unit', 'fraction');
  const updateSetting = useUpdateAppSetting();

  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  if (loadingUnit) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">General Settings</span>
      </div>

      <h1 className="text-2xl lg:text-3xl font-heading font-bold">General Settings</h1>

      {/* Opened bottle unit */}
      <CollapsibleSection icon={Ruler} title="Opened Bottle Measurement" defaultOpen>
        <p className="text-sm text-muted-foreground mb-3">How opened bottles are measured during inventory counts</p>
        <Select
          value={openedBottleUnit}
          onValueChange={(v) => {
            updateSetting.mutate({ key: 'opened_bottle_unit', value: v }, {
              onSuccess: () => toast.success('Measurement unit saved'),
              onError: (e: any) => toast.error(e.message),
            });
          }}
        >
          <SelectTrigger className="bg-secondary border-border w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fraction">Fraction of bottle (e.g. 0.3)</SelectItem>
            <SelectItem value="litres">Litres (e.g. 0.25L)</SelectItem>
          </SelectContent>
        </Select>
      </CollapsibleSection>
    </div>
  );
}
