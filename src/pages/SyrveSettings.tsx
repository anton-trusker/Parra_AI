import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Wifi, WifiOff, Settings2, RefreshCw, CheckCircle2, Loader2,
  Store, Building2, Beaker, Eye, EyeOff, Package, Clock, Zap, ChevronDown,
  ChevronRight, Wine, FileText, ArrowRightLeft, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUpdateAppSetting } from '@/hooks/useAppSettings';
import CategoryTreePicker from '@/components/syrve/CategoryTreePicker';
import {
  useSyrveConfig,
  useTestSyrveConnection,
  useSaveSyrveConfig,
  useSyrveStores,
  useSyrveCategories,
} from '@/hooks/useSyrve';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const PRODUCT_TYPES = [
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
  const testConnection = useTestSyrveConnection();
  const saveConfig = useSaveSyrveConfig();
  const updateSetting = useUpdateAppSetting();

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

  // Store & category selection
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Import rules
  const [productTypeFilters, setProductTypeFilters] = useState<string[]>(['GOODS', 'DISH']);
  const [fieldMapping, setFieldMapping] = useState<any>({
    extract_vintage: true,
    extract_volume: true,
    auto_map_category: true,
  });
  const [autoCreateWines, setAutoCreateWines] = useState(false);
  const [importInactive, setImportInactive] = useState(false);

  // Sync schedule
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(60);
  const [syncDirection, setSyncDirection] = useState('syrve_to_local');

  // Reimport mode
  const [reimportMode, setReimportMode] = useState('merge');

  // Section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    connection: true,
    store: false,
    categories: false,
    import: false,
    schedule: false,
  });

  // Saving import settings
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (config) {
      setServerUrl(config.server_url || '');
      setApiLogin(config.api_login || '');
      setSelectedStoreId(config.default_store_id || '');
      setSelectedCategoryIds(config.selected_category_ids || []);
      if (config.api_password_hash) setPasswordHash(config.api_password_hash);
      setProductTypeFilters(config.product_type_filters || ['GOODS', 'DISH']);
      setFieldMapping(config.field_mapping || { extract_vintage: true, extract_volume: true, auto_map_category: true });
      setAutoCreateWines(config.auto_create_wines ?? false);
      setImportInactive(config.import_inactive_products ?? false);
      setAutoSyncEnabled(config.auto_sync_enabled ?? false);
      setSyncInterval(config.sync_interval_minutes || 60);
      setSyncDirection(config.sync_direction || 'syrve_to_local');
      setReimportMode(config.reimport_mode || 'merge');

      // Auto-expand relevant sections
      if (config.connection_status === 'connected') {
        setOpenSections(prev => ({ ...prev, connection: false, store: true, categories: true, import: true, schedule: true }));
      }
    }
  }, [config]);

  const isConfigured = config?.connection_status === 'connected';

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
      setTested(true);
      toast.success(`Connection successful! Found ${result.stores?.length || 0} stores.`);
      setOpenSections(prev => ({ ...prev, store: true }));
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

  const handleSaveConnection = async () => {
    if (!passwordHash) {
      toast.error('Test connection first');
      return;
    }
    const selectedStore = testStores.find(s => s.id === selectedStoreId)
      || stores?.find(s => s.syrve_store_id === selectedStoreId);
    try {
      await saveConfig.mutateAsync({
        server_url: serverUrl.replace(/\/$/, ''),
        api_login: apiLogin,
        api_password_hash: passwordHash,
        default_store_id: selectedStoreId || undefined,
        default_store_name: selectedStore?.name || undefined,
        selected_category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      });
      toast.success('Connection configuration saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleSaveImportSettings = async () => {
    if (!config?.id) return;
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('syrve_config')
        .update({
          selected_category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : null,
          product_type_filters: productTypeFilters,
          field_mapping: fieldMapping,
          auto_create_wines: autoCreateWines,
          import_inactive_products: importInactive,
          auto_sync_enabled: autoSyncEnabled,
          sync_interval_minutes: syncInterval,
          sync_direction: syncDirection,
          reimport_mode: reimportMode,
        } as any)
        .eq('id', config.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['syrve_config'] });
      toast.success('Import settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleProductType = (type: string) => {
    setProductTypeFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const updateFieldMapping = (key: string, value: boolean) => {
    setFieldMapping((prev: any) => ({ ...prev, [key]: value }));
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

  const SectionHeader = ({ icon: Icon, title, subtitle, sectionKey, badge }: {
    icon: any; title: string; subtitle: string; sectionKey: string; badge?: React.ReactNode;
  }) => (
    <CollapsibleTrigger asChild>
      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {title}
                {badge}
              </CardTitle>
              <CardDescription className="text-xs">{subtitle}</CardDescription>
            </div>
          </div>
          {openSections[sectionKey] ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
    </CollapsibleTrigger>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold">Syrve Integration</h1>
          <p className="text-muted-foreground">Configure connection, import rules, and sync schedule</p>
        </div>
        <Badge variant={isConfigured ? 'default' : 'secondary'} className="shrink-0">
          {isConfigured ? 'Connected' : 'Not Connected'}
        </Badge>
      </div>

      {/* 1. Connection */}
      <Collapsible open={openSections.connection} onOpenChange={() => toggleSection('connection')}>
        <Card>
          <SectionHeader
            icon={isConfigured ? Wifi : WifiOff}
            title="Connection"
            subtitle={isConfigured ? `${config?.server_url} • Store: ${config?.default_store_name || 'Not selected'}` : 'Enter your Syrve Server API credentials'}
            sectionKey="connection"
            badge={isConfigured ? <Badge variant="outline" className="text-[10px]">Configured</Badge> : undefined}
          />
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="server_url">Server URL</Label>
                <Input
                  id="server_url"
                  placeholder="https://your-server.syrve.online:443/resto/api"
                  value={serverUrl}
                  onChange={(e) => { setServerUrl(e.target.value); setTested(false); }}
                />
                <p className="text-xs text-muted-foreground">Base URL including /resto/api</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api_login">API Login</Label>
                  <Input
                    id="api_login"
                    placeholder="admin"
                    value={apiLogin}
                    onChange={(e) => { setApiLogin(e.target.value); setTested(false); }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_password">API Password</Label>
                  <div className="relative">
                    <Input
                      id="api_password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isConfigured ? '••••••••' : 'Enter password'}
                      value={apiPassword}
                      onChange={(e) => { setApiPassword(e.target.value); setTested(false); }}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleTestConnection}
                  disabled={testConnection.isPending || !serverUrl || !apiLogin || !apiPassword}
                  variant="outline"
                >
                  {testConnection.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : tested ? <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Test Connection
                </Button>
                {serverVersion && <Badge variant="outline" className="self-center">v{serverVersion}</Badge>}
              </div>

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

              {(tested || (isConfigured && apiPassword)) && (
                <Button onClick={handleSaveConnection} disabled={saveConfig.isPending}>
                  {saveConfig.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Connection
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 2. Store Selection */}
      <Collapsible open={openSections.store} onOpenChange={() => toggleSection('store')}>
        <Card>
          <SectionHeader
            icon={Store}
            title="Store Selection"
            subtitle={selectedStoreId ? `Selected: ${availableStores.find(s => s.id === selectedStoreId)?.name || selectedStoreId}` : 'Choose default store for inventory operations'}
            sectionKey="store"
            badge={stores && stores.length > 0 ? <Badge variant="outline" className="text-[10px]">{stores.length} stores</Badge> : undefined}
          />
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {availableStores.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stores available. Test connection or run a sync first.</p>
              ) : (
                <>
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a store for inventory operations" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name} {store.code ? `(${store.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This store will be used for stock queries and inventory submissions.
                  </p>

                  {/* Synced stores list */}
                  {stores && stores.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-xs font-medium text-muted-foreground">All synced stores:</p>
                      {stores.map(store => (
                        <div key={store.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                          <span>{store.name} {store.code ? `(${store.code})` : ''}</span>
                          {config?.default_store_id === store.syrve_store_id && (
                            <Badge variant="default" className="text-[10px]">Default</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 3. Category Filter */}
      <Collapsible open={openSections.categories} onOpenChange={() => toggleSection('categories')}>
        <Card>
          <SectionHeader
            icon={Filter}
            title="Category Filter"
            subtitle={selectedCategoryIds.length > 0 ? `${selectedCategoryIds.length} categories selected` : 'All categories will be imported'}
            sectionKey="categories"
          />
          <CollapsibleContent>
            <CardContent className="pt-0">
              {categories && categories.length > 0 ? (
                <CategoryTreePicker
                  categories={categories as any}
                  selectedIds={selectedCategoryIds}
                  onSelectionChange={setSelectedCategoryIds}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No categories synced yet. Run a sync first to see categories.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 4. Import Rules */}
      <Collapsible open={openSections.import} onOpenChange={() => toggleSection('import')}>
        <Card>
          <SectionHeader
            icon={Package}
            title="Import Rules"
            subtitle="Configure what and how products are imported"
            sectionKey="import"
          />
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* Product Type Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Product Types to Import</Label>
                <p className="text-xs text-muted-foreground">Select which Syrve product types should be synchronized.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRODUCT_TYPES.map(pt => (
                    <div
                      key={pt.value}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        id={`pt-${pt.value}`}
                        checked={productTypeFilters.includes(pt.value)}
                        onCheckedChange={() => toggleProductType(pt.value)}
                      />
                      <label htmlFor={`pt-${pt.value}`} className="cursor-pointer">
                        <p className="text-sm font-medium">{pt.label}</p>
                        <p className="text-xs text-muted-foreground">{pt.description}</p>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Field Mapping */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Field Extraction & Mapping</Label>
                <p className="text-xs text-muted-foreground">Configure how Syrve product fields map to your catalog.</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Extract Vintage from Name</p>
                      <p className="text-xs text-muted-foreground">Auto-detect year (e.g. "Merlot 2019" → vintage: 2019)</p>
                    </div>
                    <Switch
                      checked={fieldMapping.extract_vintage ?? true}
                      onCheckedChange={(v) => updateFieldMapping('extract_vintage', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Extract Volume from Containers</p>
                      <p className="text-xs text-muted-foreground">Parse container data for bottle volume (ml/litres)</p>
                    </div>
                    <Switch
                      checked={fieldMapping.extract_volume ?? true}
                      onCheckedChange={(v) => updateFieldMapping('extract_volume', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Auto-map Categories</p>
                      <p className="text-xs text-muted-foreground">Automatically link products to their Syrve category</p>
                    </div>
                    <Switch
                      checked={fieldMapping.auto_map_category ?? true}
                      onCheckedChange={(v) => updateFieldMapping('auto_map_category', v)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Auto-create wines */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Wine Catalog Integration</Label>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wine className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium">Auto-create Wine Entries</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically create entries in the wine catalog from synced Syrve products
                    </p>
                  </div>
                  <Switch checked={autoCreateWines} onCheckedChange={setAutoCreateWines} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Import Inactive Products</p>
                    <p className="text-xs text-muted-foreground">Include deleted/inactive products from Syrve</p>
                  </div>
                  <Switch checked={importInactive} onCheckedChange={setImportInactive} />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 5. Sync Schedule */}
      <Collapsible open={openSections.schedule} onOpenChange={() => toggleSection('schedule')}>
        <Card>
          <SectionHeader
            icon={Clock}
            title="Sync Schedule"
            subtitle={autoSyncEnabled ? `Auto-sync every ${syncInterval} min` : 'Manual sync only'}
            sectionKey="schedule"
          />
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">Automatic Sync</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically synchronize products on a schedule
                  </p>
                </div>
                <Switch checked={autoSyncEnabled} onCheckedChange={setAutoSyncEnabled} />
              </div>

              {autoSyncEnabled && (
                <div className="space-y-2">
                  <Label>Sync Interval</Label>
                  <Select value={String(syncInterval)} onValueChange={v => setSyncInterval(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYNC_INTERVALS.map(si => (
                        <SelectItem key={si.value} value={String(si.value)}>{si.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Sync Direction
                </Label>
                <Select value={syncDirection} onValueChange={setSyncDirection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="syrve_to_local">Syrve → Local (one-way import)</SelectItem>
                    <SelectItem value="bidirectional">Bidirectional (two-way sync)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {syncDirection === 'syrve_to_local'
                    ? 'Products are imported from Syrve. Local changes do not affect Syrve.'
                    : 'Changes in either system are synchronized. Use with caution.'}
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Reimport Mode */}
      {isConfigured && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Re-import Mode</CardTitle>
                <CardDescription className="text-xs">
                  How to handle existing products when you re-import with updated category/type selections
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  value: 'merge',
                  label: 'Merge',
                  icon: '🔀',
                  description: 'Import new selection and keep all existing products untouched',
                },
                {
                  value: 'replace',
                  label: 'Replace',
                  icon: '🗑️',
                  description: 'Import new selection and permanently delete products not in it',
                },
                {
                  value: 'hide',
                  label: 'Hide Others',
                  icon: '👁️‍🗨️',
                  description: 'Import new selection and deactivate (hide) products not in it — data is preserved',
                },
              ].map(mode => (
                <div
                  key={mode.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    reimportMode === mode.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                  onClick={() => setReimportMode(mode.value)}
                >
                  <div className="text-2xl mb-2">{mode.icon}</div>
                  <p className="text-sm font-semibold">{mode.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                </div>
              ))}
            </div>
            {reimportMode === 'replace' && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Warning: Replace mode will permanently delete products that are not part of the new import selection. This cannot be undone.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save All Settings */}
      {isConfigured && (
        <div className="flex gap-3">
          <Button onClick={handleSaveImportSettings} disabled={savingSettings} size="lg">
            {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save All Settings
          </Button>
        </div>
      )}

      {/* Quick Links */}
      {isConfigured && (
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
      )}
    </div>
  );
}
