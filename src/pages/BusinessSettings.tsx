import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Globe, Banknote, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import CollapsibleSection from '@/components/CollapsibleSection';
import { useAppSetting, useUpdateAppSetting } from '@/hooks/useAppSettings';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'RUB', 'JPY', 'CNY', 'INR', 'BRL'];
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Moscow', 'Asia/Dubai',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney',
];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
];

export default function BusinessSettings() {
  const { user } = useAuthStore();
  const { data: businessName = '', isLoading: l1 } = useAppSetting<string>('business_name', '');
  const { data: legalName = '', isLoading: l2 } = useAppSetting<string>('legal_name', '');
  const { data: address = '', isLoading: l3 } = useAppSetting<string>('business_address', '');
  const { data: country = '', isLoading: l4 } = useAppSetting<string>('business_country', '');
  const { data: city = '', isLoading: l5 } = useAppSetting<string>('business_city', '');
  const { data: taxpayerId = '', isLoading: l5b } = useAppSetting<string>('taxpayer_id', '');
  const { data: language = 'en', isLoading: l6 } = useAppSetting<string>('language', 'en');
  const { data: currency = 'USD', isLoading: l7 } = useAppSetting<string>('currency', 'USD');
  const { data: timezone = 'UTC', isLoading: l8 } = useAppSetting<string>('timezone', 'UTC');
  const { data: defaultBottleSize = 750, isLoading: l9 } = useAppSetting<number>('default_bottle_size_ml', 750);
  const { data: defaultGlassSize = 150, isLoading: l10 } = useAppSetting<number>('default_glass_size_ml', 150);

  const update = useUpdateAppSetting();
  const isLoading = l1 || l2 || l3 || l4 || l5 || l5b || l6 || l7 || l8 || l9 || l10;

  const [form, setForm] = useState({
    business_name: '', legal_name: '', business_address: '', business_country: '', business_city: '', taxpayer_id: '',
    language: 'en', currency: 'USD', timezone: 'UTC',
    default_bottle_size_ml: 750, default_glass_size_ml: 150,
  });

  useEffect(() => {
    if (!isLoading) {
      setForm({
        business_name: businessName, legal_name: legalName, business_address: address,
        business_country: country, business_city: city, taxpayer_id: taxpayerId,
        language, currency, timezone,
        default_bottle_size_ml: defaultBottleSize, default_glass_size_ml: defaultGlassSize,
      });
    }
  }, [isLoading, businessName, legalName, address, country, city, taxpayerId, language, currency, timezone, defaultBottleSize, defaultGlassSize]);

  const [saving, setSaving] = useState(false);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const handleSave = async () => {
    if (!form.business_name.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      const entries = Object.entries(form);
      for (const [key, value] of entries) {
        await update.mutateAsync({ key, value });
      }
      toast.success('Business settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
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
        <span className="text-foreground">Business</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Business Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <CollapsibleSection icon={Building2} title="Business Profile" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Business Name *</Label>
            <Input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} placeholder="My Restaurant" className="bg-secondary border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Legal Name</Label>
            <Input value={form.legal_name} onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))} placeholder="Optional" className="bg-secondary border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Address</Label>
            <Input value={form.business_address} onChange={e => setForm(f => ({ ...f, business_address: e.target.value }))} placeholder="Optional" className="bg-secondary border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Country</Label>
            <Input value={form.business_country} onChange={e => setForm(f => ({ ...f, business_country: e.target.value }))} placeholder="e.g. UAE" className="bg-secondary border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">City</Label>
            <Input value={form.business_city} onChange={e => setForm(f => ({ ...f, business_city: e.target.value }))} placeholder="e.g. Dubai" className="bg-secondary border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Taxpayer ID</Label>
            <Input value={form.taxpayer_id} onChange={e => setForm(f => ({ ...f, taxpayer_id: e.target.value }))} placeholder="Tax ID / INN" className="bg-secondary border-border" />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={Globe} title="Locale" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Language</Label>
            <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Currency</Label>
            <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Timezone</Label>
            <Select value={form.timezone} onValueChange={v => setForm(f => ({ ...f, timezone: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={Banknote} title="Operational Defaults">
        <p className="text-sm text-muted-foreground mb-3">Fallback values used when no product-level override exists</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Default Bottle Size (ml)</Label>
            <Input type="number" value={form.default_bottle_size_ml} onChange={e => setForm(f => ({ ...f, default_bottle_size_ml: parseInt(e.target.value) || 750 }))} className="bg-secondary border-border w-32" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Default Glass Size (ml)</Label>
            <Input type="number" value={form.default_glass_size_ml} onChange={e => setForm(f => ({ ...f, default_glass_size_ml: parseInt(e.target.value) || 150 }))} className="bg-secondary border-border w-32" />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
