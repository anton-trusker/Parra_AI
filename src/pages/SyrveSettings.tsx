import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Wifi, WifiOff, Settings2, RefreshCw, CheckCircle2, Loader2,
  Store, Building2, Beaker, Eye, EyeOff, Package, Clock, Zap, ChevronDown, Warehouse,
  ChevronRight, FileText, ArrowRightLeft, Filter, BarChart3, Box, Layers, Info, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUpdateAppSetting } from '@/hooks/useAppSettings';
import CategoryTreePicker from '@/components/syrve/CategoryTreePicker';
import {
  useSyrveConfig,
  useTestSyrveConnection,
  useSaveSyrveConfig,
  useSyrveStores,
  useSyrveCategories,
  useSyrveSync,
  useLastSyncStats,
  useProductCount,
  useCategoryProductCounts,
  useCleanAllSyrveData,
} from '@/hooks/useSyrve';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const DEFAULT_PRODUCT_TYPES = [
  { value: 'GOODS', label: 'Goods', description: 'Physical items / products' },
  { value: 'DISH', label: 'Dishes', description: 'Prepared menu items' },
  { value: 'MODIFIER', label: 'Modifiers', description: 'Modifiers & additions' },
  { value: 'PREPARED', label: 'Prepared', description: 'Pre-prepared items' },
  { value: 'SERVICE', label: 'Services', description: 'Non-physical services' },
];

const SYNC_INTERVALS = [
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every hour' },
  { value: 120, label: 'Every 2 hours' },
  { value: 360, label: 'Every 6 hours' },
  { value: 720, label: 'Every 12 hours' },
  { value: 1440, label: 'Once a day' },
];

export default function SyrveSettings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: config, isLoading: configLoading } = useSyrveConfig();
  const { data: stores } = useSyrveStores();
  const { data: categories } = useSyrveCategories();
  const { data: lastSync } = useLastSyncStats();
  const { data: productCount } = useProductCount();
  const { data: categoryProductCounts } = useCategoryProductCounts();
  const testConnection = useTestSyrveConnection();
  const saveConfig = useSaveSyrveConfig();
  const syncMutation = useSyrveSync();
  const updateSetting = useUpdateAppSetting();
  const cleanAllMutation = useCleanAllSyrveData();

  // Connection fields
  const [serverUrl, setServerUrl] = useState('');
  const [apiLogin, setApiLogin] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testStores, setTestStores] = useState<any[]>([]);
  const [passwordHash, setPasswordHash] = useState('');
  const [tested, setTested] = useState(false);
  const [serverVersion, setServerVersion] = useState('');
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [importingBusiness, setImportingBusiness] = useState(false);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [discoveredProductTypes, setDiscoveredProductTypes] = useState<string[]>([]);

  // Store & category selection
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Import rules
  const [productTypeFilters, setProductTypeFilters] = useState<string[]>(['GOODS', 'DISH']);
  const [fieldMapping, setFieldMapping] = useState<any>({
    extract_vintage: true,
    extract_volume: true,
    auto_map_category: true,
  });
  const [importInactive, setImportInactive] = useState(false);

  // Sync schedule
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(60);
  const [syncDirection, setSyncDirection] = useState('syrve_to_local');

  // Reimport mode
  const [reimportMode, setReimportMode] = useState('merge');

  // Edit sections for existing connection flow
  const [editSections, setEditSections] = useState<Record<string, boolean>>({
    connection: false,
    stores: false,
    categories: false,
    import: false,
    schedule: false,
  });

  // Refresh loading states
  const [refreshingStores, setRefreshingStores] = useState(false);
  const [refreshingCategories, setRefreshingCategories] = useState(false);

  useEffect(() => {
    if (selectedCategoryIds.length > 0 && fieldMapping.wine_category_ids?.length > 0) {
      const validIds = fieldMapping.wine_category_ids.filter((id: string) => selectedCategoryIds.includes(id));
      if (validIds.length !== fieldMapping.wine_category_ids.length) {
        setFieldMapping((prev: any) => ({ ...prev, wine_category_ids: validIds }));
      }
    }
  }, [selectedCategoryIds]);

  const [savingSettings, setSavingSettings] = useState(false);
  const [activeSyncRunId, setActiveSyncRunId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ stage: string; progress: number } | null>(null);
  const [syncFinished, setSyncFinished] = useState(false);
  const [configDirty, setConfigDirty] = useState(false);

  const markDirty = useCallback(() => setConfigDirty(true), []);

  // Build merged product types list
  const allProductTypes = (() => {
    const known = new Set(DEFAULT_PRODUCT_TYPES.map(pt => pt.value));
    const extra = discoveredProductTypes.filter(t => !known.has(t));
    return [
      ...DEFAULT_PRODUCT_TYPES,
      ...extra.map(t => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase(), description: `Discovered from Syrve` })),
    ];
  })();

  // Poll sync progress
  useEffect(() => {
    if (!activeSyncRunId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('syrve_sync_runs')
        .select('status, stats, error')
        .eq('id', activeSyncRunId)
        .single();
      if (data) {
        const s = data.stats as any;
        setSyncProgress({ stage: s?.stage || 'running', progress: s?.progress || 0 });
        if (data.status === 'success' || data.status === 'failed') {
          clearInterval(interval);
          setActiveSyncRunId(null);
          setSyncFinished(true);
          setConfigDirty(false);
          if (data.status === 'success') {
            const unitsInfo = s?.measurement_units ? `, ${s.measurement_units} units` : '';
            const aiInfo = s?.ai_enriched ? `, ${s.ai_enriched} AI-enriched (~$${s.ai_estimated_cost_usd || 0})` : '';
            toast.success(`Sync completed! ${s?.products || 0} products, ${s?.categories || 0} categories${unitsInfo}, ${s?.prices_updated || 0} prices, ${s?.stock_updated || 0} stock levels${s?.wines_created ? `, ${s.wines_created} wines created` : ''}${aiInfo}${s?.deactivated ? `, ${s.deactivated} deactivated` : ''}.`);
          } else {
            toast.error(`Sync failed: ${data.error || 'Unknown error'}`);
          }
          setSyncProgress(null);
          qc.invalidateQueries({ queryKey: ['syrve_sync_runs'] });
          qc.invalidateQueries({ queryKey: ['syrve_products'] });
          qc.invalidateQueries({ queryKey: ['syrve_categories'] });
          qc.invalidateQueries({ queryKey: ['syrve_stores'] });
          qc.invalidateQueries({ queryKey: ['last_sync_stats'] });
          qc.invalidateQueries({ queryKey: ['product_count'] });
          qc.invalidateQueries({ queryKey: ['category_product_counts'] });
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [activeSyncRunId, qc]);

  useEffect(() => {
    if (config) {
      setServerUrl(config.server_url || '');
      setApiLogin(config.api_login || '');
      setSelectedStoreId(config.default_store_id || '');
      setSelectedStoreIds((config as any).selected_store_ids || []);
      setSelectedCategoryIds(config.selected_category_ids || []);
      if (config.api_password_hash) setPasswordHash(config.api_password_hash);
      setProductTypeFilters(config.product_type_filters || ['GOODS', 'DISH']);
      setFieldMapping(config.field_mapping || { extract_vintage: true, extract_volume: true, auto_map_category: true });
      setImportInactive(config.import_inactive_products ?? false);
      setAutoSyncEnabled(config.auto_sync_enabled ?? false);
      setSyncInterval(config.sync_interval_minutes || 60);
      setSyncDirection(config.sync_direction || 'syrve_to_local');
      setReimportMode(config.reimport_mode || 'merge');
    }
  }, [config]);

  const isConfigured = config?.connection_status === 'connected';

  const handleTestConnection = async () => {
    if (!serverUrl || !apiLogin || !apiPassword) {
      toast.error('All fields are required');
      return;
    }
    try {
      const result = await testConnection.mutateAsync({
        server_url: serverUrl.replace(/\/$/, ''),
        api_login: apiLogin,
        api_password: apiPassword,
      });
      setTestStores(result.stores || []);
      setPasswordHash(result.password_hash);
      setServerVersion(result.server_version || '');
      setBusinessInfo(result.business_info || null);
      setCategoriesCount(result.categories_count || 0);
      setDiscoveredProductTypes(result.product_types || []);
      setTested(true);
      toast.success(`Connected! Found ${result.stores?.length || 0} warehouses, ${result.categories_count || 0} categories, ${result.measurement_units || 0} units.`);
      qc.invalidateQueries({ queryKey: ['syrve_categories'] });
      qc.invalidateQueries({ queryKey: ['syrve_stores'] });
      qc.invalidateQueries({ queryKey: ['category_product_counts'] });
    } catch (err: any) {
      toast.error(err.message || 'Connection failed');
      setTested(false);
    }
  };

  const handleImportBusinessInfo = async () => {
    if (!businessInfo) return;
    setImportingBusiness(true);
    try {
      const mapping: Record<string, string | null> = {
        business_name: businessInfo.business_name,
        legal_name: businessInfo.legal_name,
        business_address: businessInfo.address,
        business_country: businessInfo.country,
        business_city: businessInfo.city,
        taxpayer_id: businessInfo.taxpayer_id,
      };
      for (const [key, value] of Object.entries(mapping)) {
        if (value) await updateSetting.mutateAsync({ key, value });
      }
      toast.success('Business info imported to Business Settings');
    } catch (e: any) {
      toast.error(e.message || 'Failed to import');
    } finally {
      setImportingBusiness(false);
    }
  };

  const handleRefreshStores = async () => {
    setRefreshingStores(true);
    try {
      syncMutation.mutate('stores', {
        onSuccess: (data: any) => {
          setActiveSyncRunId(data?.sync_run_id || null);
          setSyncProgress({ stage: 'syncing_stores', progress: 10 });
          toast.success('Refreshing warehouses from Syrve...');
        },
        onError: (err: any) => toast.error(err.message || 'Failed'),
      });
    } finally {
      setRefreshingStores(false);
    }
  };

  const handleRefreshCategories = async () => {
    setRefreshingCategories(true);
    try {
      syncMutation.mutate('categories', {
        onSuccess: (data: any) => {
          setActiveSyncRunId(data?.sync_run_id || null);
          setSyncProgress({ stage: 'syncing_categories', progress: 30 });
          toast.success('Refreshing categories from Syrve...');
        },
        onError: (err: any) => toast.error(err.message || 'Failed'),
      });
    } finally {
      setRefreshingCategories(false);
    }
  };

  const handleSaveAndImport = async () => {
    if (!passwordHash) {
      toast.error('Test connection first');
      return;
    }
    setSavingSettings(true);
    try {
      const selectedStore = testStores.find(s => s.id === selectedStoreId)
        || stores?.find(s => s.syrve_store_id === selectedStoreId);
      await saveConfig.mutateAsync({
        server_url: serverUrl.replace(/\/$/, ''),
        api_login: apiLogin,
        api_password_hash: passwordHash,
        default_store_id: selectedStoreId || undefined,
        default_store_name: selectedStore?.name || undefined,
        selected_store_ids: selectedStoreIds.length > 0 ? selectedStoreIds : undefined,
        selected_category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      });

      const configId = config?.id;
      if (configId) {
        await supabase
          .from('syrve_config')
          .update({
            selected_category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : null,
            product_type_filters: productTypeFilters,
            field_mapping: fieldMapping,
            auto_create_wines: (fieldMapping.wine_category_ids?.length || 0) > 0,
            import_inactive_products: importInactive,
            reimport_mode: reimportMode,
          } as any)
          .eq('id', configId);
      }

      syncMutation.mutate('bootstrap', {
        onSuccess: (data: any) => {
          setActiveSyncRunId(data?.sync_run_id || null);
          setSyncProgress({ stage: 'authenticating', progress: 5 });
        },
        onError: (err: any) => toast.error(err.message || 'Sync failed'),
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!config?.id) return;
    setSavingSettings(true);
    try {
      if (passwordHash) {
        const selectedStore = testStores.find(s => s.id === selectedStoreId)
          || stores?.find(s => s.syrve_store_id === selectedStoreId);
        await saveConfig.mutateAsync({
          server_url: serverUrl.replace(/\/$/, ''),
          api_login: apiLogin,
          api_password_hash: passwordHash,
          default_store_id: selectedStoreId || undefined,
          default_store_name: selectedStore?.name || undefined,
          selected_store_ids: selectedStoreIds.length > 0 ? selectedStoreIds : undefined,
          selected_category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        });
      }

      const { error } = await supabase
        .from('syrve_config')
        .update({
          selected_category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : null,
          selected_store_ids: selectedStoreIds.length > 0 ? selectedStoreIds : null,
          product_type_filters: productTypeFilters,
          field_mapping: fieldMapping,
          auto_create_wines: (fieldMapping.wine_category_ids?.length || 0) > 0,
          import_inactive_products: importInactive,
          auto_sync_enabled: autoSyncEnabled,
          sync_interval_minutes: syncInterval,
          sync_direction: syncDirection,
          reimport_mode: reimportMode,
        } as any)
        .eq('id', config.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['syrve_config'] });
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSync = (type: string) => {
    syncMutation.mutate(type, {
      onSuccess: (data: any) => {
        setActiveSyncRunId(data?.sync_run_id || null);
        setSyncProgress({ stage: 'authenticating', progress: 5 });
        setSyncFinished(false);
      },
      onError: (err: any) => toast.error(err.message || 'Sync failed'),
    });
  };

  const handleCleanAll = async () => {
    try {
      await cleanAllMutation.mutateAsync();
      toast.success('All Syrve data cleaned. You can now reconfigure the integration.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to clean data');
    }
  };

  const toggleProductType = (type: string) => {
    setProductTypeFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    markDirty();
  };

  const updateFieldMapping = (key: string, value: boolean) => {
    setFieldMapping((prev: any) => ({ ...prev, [key]: value }));
    markDirty();
  };

  const toggleAllStores = () => {
    if (selectedStoreIds.length === availableStores.length) {
      setSelectedStoreIds([]);
      setSelectedStoreId('');
    } else {
      const allIds = availableStores.map(s => s.id);
      setSelectedStoreIds(allIds);
      if (!selectedStoreId || !allIds.includes(selectedStoreId)) {
        setSelectedStoreId(allIds[0] || '');
      }
    }
    markDirty();
  };

  const SYNC_STAGES = [
    { key: 'authenticating', label: 'Authenticating' },
    { key: 'syncing_stores', label: 'Syncing Warehouses' },
    { key: 'syncing_units', label: 'Syncing Units' },
    { key: 'syncing_categories', label: 'Syncing Categories' },
    { key: 'importing_products', label: 'Importing Products' },
    { key: 'fetching_prices', label: 'Fetching Prices' },
    { key: 'fetching_stock', label: 'Fetching Stock' },
    { key: 'applying_reimport_mode', label: 'Applying Rules' },
    { key: 'enriching_wines', label: 'Enriching Wines' },
    { key: 'ai_enriching', label: 'AI Enrichment' },
    { key: 'completed', label: 'Completed' },
  ];

  const getStageLabel = (stage: string) => SYNC_STAGES.find(s => s.key === stage)?.label || stage;

  const renderStageSteps = (currentStage: string) => {
    const currentIdx = SYNC_STAGES.findIndex(s => s.key === currentStage);
    return SYNC_STAGES.map((s) => {
      const stageIdx = SYNC_STAGES.findIndex(st => st.key === s.key);
      const isDone = stageIdx < currentIdx;
      const isCurrent = s.key === currentStage;
      return (
        <Badge key={s.key} variant={isDone ? 'default' : isCurrent ? 'secondary' : 'outline'} className="text-xs">
          {isDone ? <CheckCircle2 className="w-3 h-3 mr-1" /> : isCurrent ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
          {s.label}
        </Badge>
      );
    });
  };

  if (configLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const availableStores = tested && testStores.length > 0
    ? testStores.map(s => ({ id: s.id, name: s.name, code: s.code }))
    : (stores || []).map(s => ({ id: s.syrve_store_id, name: s.name, code: s.code }));

  const SectionHeader = ({ icon: Icon, title, subtitle, sectionKey, badge, open, onToggle, onRefresh, refreshing }: {
    icon: any; title: string; subtitle: string; sectionKey: string; badge?: React.ReactNode;
    open: boolean; onToggle: () => void; onRefresh?: () => void; refreshing?: boolean;
  }) => (
    <div
      className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg p-4"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <div className="text-base font-semibold flex items-center gap-2">
              {title}
              {badge}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={refreshing || !!activeSyncRunId}
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}>
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            </Button>
          )}
          {open ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
        </div>
      </div>
    </div>
  );

  const SyncProgressCard = () => (
    (activeSyncRunId || syncMutation.isPending) ? (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium">{getStageLabel(syncProgress?.stage || 'authenticating')}</span>
            </div>
            <span className="text-sm text-muted-foreground">{syncProgress?.progress || 0}%</span>
          </div>
          <Progress value={syncProgress?.progress || 0} className="h-2" />
          <div className="flex gap-2 flex-wrap">
            {syncProgress?.stage && renderStageSteps(syncProgress.stage)}
          </div>
        </CardContent>
      </Card>
    ) : null
  );

  // ─── FLOW 1: New Connection (wizard) ───
  if (!isConfigured) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-heading font-bold">Syrve Integration</h1>
            <p className="text-muted-foreground">Connect to your Syrve Server and configure import</p>
          </div>
          <Badge variant="secondary">Not Connected</Badge>
        </div>

        {/* Step 1: Credentials */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Step 1: Connection</CardTitle>
                <CardDescription className="text-xs">Enter your Syrve Server API credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="server_url">Server URL</Label>
              <Input id="server_url" placeholder="https://your-server.syrve.online:443/resto/api" value={serverUrl}
                onChange={(e) => { setServerUrl(e.target.value); setTested(false); }} />
              <p className="text-xs text-muted-foreground">Base URL including /resto/api</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api_login">API Login</Label>
                <Input id="api_login" placeholder="admin" value={apiLogin}
                  onChange={(e) => { setApiLogin(e.target.value); setTested(false); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_password">API Password</Label>
                <div className="relative">
                  <Input id="api_password" type={showPassword ? 'text' : 'password'} placeholder="Enter password"
                    value={apiPassword} onChange={(e) => { setApiPassword(e.target.value); setTested(false); }} className="pr-10" />
                  <Button type="button" variant="ghost" size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Button onClick={handleTestConnection} disabled={testConnection.isPending || !serverUrl || !apiLogin || !apiPassword} variant="outline">
                {testConnection.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : tested ? <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Test Connection
              </Button>
              {serverVersion && <Badge variant="outline">v{serverVersion}</Badge>}
              {tested && <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</Badge>}
            </div>

            {tested && (
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Card className="border-dashed"><CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{testStores.length}</p>
                  <p className="text-xs text-muted-foreground">Warehouses</p>
                </CardContent></Card>
                <Card className="border-dashed"><CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{categoriesCount}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </CardContent></Card>
                <Card className="border-dashed"><CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{businessInfo ? '✓' : '—'}</p>
                  <p className="text-xs text-muted-foreground">Business Info</p>
                </CardContent></Card>
              </div>
            )}

            {tested && businessInfo && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <p className="font-medium text-sm">Business Info Detected</p>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {businessInfo.legal_name && <p>Legal: {businessInfo.legal_name}</p>}
                        {businessInfo.business_name && <p>Name: {businessInfo.business_name}</p>}
                        {businessInfo.taxpayer_id && <p>Tax ID: {businessInfo.taxpayer_id}</p>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleImportBusinessInfo} disabled={importingBusiness}>
                      {importingBusiness && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      Import
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {tested && (
          <>
            {/* Step 2: Warehouses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Step 2: Select Warehouses</CardTitle>
                      <CardDescription className="text-xs">Choose which warehouses to integrate</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefreshStores} disabled={refreshingStores || !!activeSyncRunId}>
                    <RefreshCw className={cn("w-3.5 h-3.5", refreshingStores && "animate-spin")} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {availableStores.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox checked={selectedStoreIds.length === availableStores.length && availableStores.length > 0} onCheckedChange={toggleAllStores} />
                    <Label className="text-sm cursor-pointer" onClick={toggleAllStores}>Select All ({availableStores.length})</Label>
                  </div>
                )}
                <div className="space-y-2">
                  {availableStores.map((store) => {
                    const isSelected = selectedStoreIds.includes(store.id);
                    const isDefault = selectedStoreId === store.id;
                    return (
                      <div key={store.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/30'}`}>
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const next = [...selectedStoreIds, store.id]; setSelectedStoreIds(next);
                                if (next.length === 1) setSelectedStoreId(store.id);
                              } else {
                                const next = selectedStoreIds.filter(id => id !== store.id); setSelectedStoreIds(next);
                                if (isDefault) setSelectedStoreId(next[0] || '');
                              }
                            }} />
                          <div>
                            <p className="text-sm font-medium">{store.name}</p>
                            {store.code && <p className="text-xs text-muted-foreground">Code: {store.code}</p>}
                          </div>
                        </div>
                        {isSelected && (
                          <Button variant={isDefault ? 'default' : 'outline'} size="sm" className="text-xs h-7"
                            onClick={() => setSelectedStoreId(store.id)} disabled={isDefault}>
                            {isDefault ? 'Default' : 'Set Default'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Categories */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Filter className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Step 3: Select Categories</CardTitle>
                      <CardDescription className="text-xs">Choose which product categories to import</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefreshCategories} disabled={refreshingCategories || !!activeSyncRunId}>
                    <RefreshCw className={cn("w-3.5 h-3.5", refreshingCategories && "animate-spin")} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {categories && categories.length > 0 ? (
                  <>
                    <CategoryTreePicker
                      categories={categories as any}
                      selectedIds={selectedCategoryIds}
                      onSelectionChange={setSelectedCategoryIds}
                      productCounts={categoryProductCounts}
                    />
                    <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-muted/50 text-muted-foreground">
                      <Info className="w-4 h-4 shrink-0" />
                      <p className="text-xs">Products without a category will also be imported.</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No categories available. Categories were imported during connection test.</p>
                )}
              </CardContent>
            </Card>

            {/* Step 4: Import Rules */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Step 4: Import Rules</CardTitle>
                    <CardDescription className="text-xs">Configure what and how products are imported</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Product Types to Import</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allProductTypes.map(pt => (
                      <div key={pt.value} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <Checkbox id={`pt-${pt.value}`} checked={productTypeFilters.includes(pt.value)} onCheckedChange={() => toggleProductType(pt.value)} />
                        <label htmlFor={`pt-${pt.value}`} className="cursor-pointer">
                          <p className="text-sm font-medium">{pt.label}</p>
                          <p className="text-xs text-muted-foreground">{pt.description}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save & Import */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button onClick={handleSaveAndImport} disabled={savingSettings || !!activeSyncRunId || syncMutation.isPending || selectedStoreIds.length === 0}
                  size="lg" className="flex-1 gap-2 text-base py-6">
                  {(savingSettings || syncMutation.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  Save & Import Products
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2 py-6" disabled={!!activeSyncRunId || syncMutation.isPending}>
                      <Trash2 className="w-4 h-4" />
                      Clean Import
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clean Import</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete ALL existing Syrve products, barcodes, and stock data, then perform a fresh import. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => {
                        handleSaveSettings().then(() => handleSync('clean_import'));
                      }}>Clean & Import</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {selectedStoreIds.length === 0 && (
                <p className="text-xs text-destructive text-center">Select at least one warehouse to continue</p>
              )}
              <SyncProgressCard />
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── FLOW 2: Existing Connection (dashboard + edit) ───
  const lastSyncStats = lastSync?.stats as any;
  const toggleEdit = (key: string) => {
    setEditSections(prev => ({ ...prev, [key]: !prev[key] }));
    markDirty();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold">Syrve Integration</h1>
          <p className="text-muted-foreground">Manage connection, sync, and import rules</p>
        </div>
        <Badge variant="default" className="gap-1 shrink-0"><Wifi className="w-3 h-3" /> Connected</Badge>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Warehouse className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{selectedStoreIds.length}</p>
            <p className="text-xs text-muted-foreground">of {stores?.length || 0} Warehouses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Layers className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{selectedCategoryIds.length || 'All'}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Box className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{productCount ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{lastSyncStats?.stock_updated || '—'}</p>
            <p className="text-xs text-muted-foreground">Stock Updated</p>
          </CardContent>
        </Card>
      </div>

      {lastSync && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <CheckCircle2 className="w-3 h-3 text-primary" />
          Last sync: {new Date(lastSync.finished_at || lastSync.started_at).toLocaleString()} •{' '}
          {lastSyncStats?.products || 0} products, {lastSyncStats?.prices_updated || 0} prices, {lastSyncStats?.stock_updated || 0} stock
          {lastSyncStats?.deactivated ? `, ${lastSyncStats.deactivated} deactivated` : ''}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => { handleSaveSettings().then(() => handleSync('bootstrap')); }}
          disabled={!!activeSyncRunId || syncMutation.isPending} className="gap-2">
          {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {configDirty ? 'Save & Re-import' : 'Re-sync Products, Prices & Stock'}
        </Button>
        <Button onClick={() => handleSync('prices_stock')} variant="outline"
          disabled={!!activeSyncRunId || syncMutation.isPending} className="gap-2">
          <Zap className="w-4 h-4" />
          Refresh Prices & Stock Only
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={!!activeSyncRunId || syncMutation.isPending} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Clean Import
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clean Import</AlertDialogTitle>
              <AlertDialogDescription>
                Delete all products, barcodes, stock data, then re-import everything fresh from Syrve. Data is preserved in Syrve.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => {
                handleSaveSettings().then(() => handleSync('clean_import'));
              }}>Clean & Import</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <SyncProgressCard />

      {/* Editable Sections */}
      {/* Connection */}
      <Card>
        <SectionHeader icon={Wifi} title="Connection" sectionKey="connection"
          subtitle={`${config?.server_url} • ${config?.default_store_name || 'No default warehouse'}`}
          badge={<Badge variant="outline" className="text-[10px]">Configured</Badge>}
          open={editSections.connection} onToggle={() => toggleEdit('connection')} />
        {editSections.connection && (
          <CardContent className="space-y-4 pt-0 px-4 pb-4">
            <div className="space-y-2">
              <Label>Server URL</Label>
              <Input value={serverUrl} onChange={(e) => { setServerUrl(e.target.value); setTested(false); }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>API Login</Label>
                <Input value={apiLogin} onChange={(e) => { setApiLogin(e.target.value); setTested(false); }} />
              </div>
              <div className="space-y-2">
                <Label>API Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={apiPassword}
                    onChange={(e) => { setApiPassword(e.target.value); setTested(false); }} className="pr-10" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={handleTestConnection} disabled={testConnection.isPending || !apiPassword} variant="outline" size="sm">
              {testConnection.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Re-test Connection
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Warehouses */}
      <Card>
        <SectionHeader icon={Warehouse} title="Warehouses / Storages" sectionKey="stores"
          subtitle={`${selectedStoreIds.length} selected of ${availableStores.length}`}
          open={editSections.stores} onToggle={() => toggleEdit('stores')}
          onRefresh={handleRefreshStores} refreshing={refreshingStores} />
        {editSections.stores && (
          <CardContent className="space-y-4 pt-0 px-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox checked={selectedStoreIds.length === availableStores.length && availableStores.length > 0} onCheckedChange={toggleAllStores} />
              <Label className="text-sm cursor-pointer" onClick={toggleAllStores}>Select All ({availableStores.length})</Label>
            </div>
            <div className="space-y-2">
              {availableStores.map((store) => {
                const isSelected = selectedStoreIds.includes(store.id);
                const isDefault = selectedStoreId === store.id;
                return (
                  <div key={store.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/30'}`}>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const next = [...selectedStoreIds, store.id]; setSelectedStoreIds(next);
                            if (next.length === 1) setSelectedStoreId(store.id);
                          } else {
                            const next = selectedStoreIds.filter(id => id !== store.id); setSelectedStoreIds(next);
                            if (isDefault) setSelectedStoreId(next[0] || '');
                          }
                          markDirty();
                        }} />
                      <div>
                        <p className="text-sm font-medium">{store.name}</p>
                        {store.code && <p className="text-xs text-muted-foreground">Code: {store.code}</p>}
                      </div>
                    </div>
                    {isSelected && (
                      <Button variant={isDefault ? 'default' : 'outline'} size="sm" className="text-xs h-7"
                        onClick={() => setSelectedStoreId(store.id)} disabled={isDefault}>
                        {isDefault ? 'Default' : 'Set Default'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Categories */}
      <Card>
        <SectionHeader icon={Filter} title="Category Filter" sectionKey="categories"
          subtitle={selectedCategoryIds.length > 0 ? `${selectedCategoryIds.length} categories selected` : 'All categories'}
          open={editSections.categories} onToggle={() => toggleEdit('categories')}
          onRefresh={handleRefreshCategories} refreshing={refreshingCategories} />
        {editSections.categories && (
          <CardContent className="pt-0 px-4 pb-4">
            {categories && categories.length > 0 ? (
              <>
                <CategoryTreePicker categories={categories as any} selectedIds={selectedCategoryIds}
                  onSelectionChange={(ids) => { setSelectedCategoryIds(ids); markDirty(); }}
                  productCounts={categoryProductCounts}
                  onDeleteCategory={async (id) => {
                    const { data: children } = await supabase.from('categories').select('id').eq('parent_id', id);
                    const ids = [id, ...(children || []).map(c => c.id)];
                    await supabase.from('categories').update({ is_active: false, is_deleted: true } as any).in('id', ids);
                    toast.success('Category deleted');
                    qc.invalidateQueries({ queryKey: ['syrve_categories'] });
                  }} />
                <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-muted/50 text-muted-foreground">
                  <Info className="w-4 h-4 shrink-0" />
                  <p className="text-xs">Products without a category will also be imported.</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No categories synced yet.</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Import Rules */}
      <Card>
        <SectionHeader icon={Package} title="Import Rules" sectionKey="import"
          subtitle={`${productTypeFilters.length} product types • Soft deactivation mode`}
          open={editSections.import} onToggle={() => toggleEdit('import')} />
        {editSections.import && (
          <CardContent className="space-y-6 pt-0 px-4 pb-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Product Types to Import</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allProductTypes.map(pt => (
                  <div key={pt.value} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <Checkbox id={`pt-${pt.value}`} checked={productTypeFilters.includes(pt.value)} onCheckedChange={() => toggleProductType(pt.value)} />
                    <label htmlFor={`pt-${pt.value}`} className="cursor-pointer">
                      <p className="text-sm font-medium">{pt.label}</p>
                      <p className="text-xs text-muted-foreground">{pt.description}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Field Extraction & Mapping</Label>
              {[
                { key: 'extract_vintage', label: 'Extract Vintage from Name', desc: 'Auto-detect year (e.g. "Merlot 2019" → vintage: 2019)' },
                { key: 'extract_volume', label: 'Extract Volume from Containers', desc: 'Parse container data for bottle volume' },
                { key: 'auto_map_category', label: 'Auto-map Categories', desc: 'Automatically link products to their Syrve category' },
                { key: 'sync_prices', label: 'Sync Prices', desc: 'Fetch sale and purchase prices from Syrve' },
                { key: 'sync_stock', label: 'Sync Stock Levels', desc: 'Fetch current stock balances' },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between p-3 rounded-lg border">
                  <div><p className="text-sm font-medium">{f.label}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
                  <Switch checked={fieldMapping[f.key] ?? true} onCheckedChange={(v) => updateFieldMapping(f.key, v)} />
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div><p className="text-sm font-medium">Import Inactive Products</p><p className="text-xs text-muted-foreground">Include deleted/inactive products from Syrve</p></div>
              <Switch checked={importInactive} onCheckedChange={(v) => { setImportInactive(v); markDirty(); }} />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">
                <strong>Import behavior:</strong> New products are added, existing products are updated. Products no longer matching your selection are soft-deactivated (data preserved, hidden from results).
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sync Schedule */}
      <Card>
        <SectionHeader icon={Clock} title="Sync Schedule" sectionKey="schedule"
          subtitle={autoSyncEnabled ? `Auto-sync every ${syncInterval} min` : 'Manual sync only'}
          open={editSections.schedule} onToggle={() => toggleEdit('schedule')} />
        {editSections.schedule && (
          <CardContent className="space-y-4 pt-0 px-4 pb-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /><p className="text-sm font-medium">Automatic Sync</p></div>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically synchronize products on a schedule</p>
              </div>
              <Switch checked={autoSyncEnabled} onCheckedChange={(v) => { setAutoSyncEnabled(v); markDirty(); }} />
            </div>
            {autoSyncEnabled && (
              <div className="space-y-2">
                <Label>Sync Interval</Label>
                <Select value={String(syncInterval)} onValueChange={v => { setSyncInterval(Number(v)); markDirty(); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SYNC_INTERVALS.map(si => (
                      <SelectItem key={si.value} value={String(si.value)}>{si.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" />Sync Direction</Label>
              <Select value={syncDirection} onValueChange={v => { setSyncDirection(v); markDirty(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="syrve_to_local">Syrve → Local (one-way import)</SelectItem>
                  <SelectItem value="bidirectional">Bidirectional (two-way sync)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Save Settings + Clean All */}
      <div className="flex gap-3">
        <Button onClick={handleSaveSettings} disabled={savingSettings || !!activeSyncRunId} variant="outline" className="gap-2">
          {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Settings
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive" disabled={cleanAllMutation.isPending || !!activeSyncRunId}>
              <Trash2 className="w-4 h-4" />
              Clean All Syrve Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clean All Syrve Data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete ALL imported data: products, categories, stores, measurement units, stock levels, barcodes, sync history, and API logs. The connection will be reset to "Not Configured". This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleCleanAll}>
                {cleanAllMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/settings/syrve/sync')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Sync Management</h3>
              <p className="text-sm text-muted-foreground">Run sync operations and view history</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/settings/syrve/testing')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Beaker className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Integration Testing</h3>
              <p className="text-sm text-muted-foreground">Test mode, API logs, and per-section import</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
