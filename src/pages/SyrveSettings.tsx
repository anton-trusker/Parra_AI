import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Wifi, WifiOff, Settings2, RefreshCw, CheckCircle2, XCircle, Loader2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useSyrveConfig,
  useTestSyrveConnection,
  useSaveSyrveConfig,
  useSyrveStores,
} from '@/hooks/useSyrve';

export default function SyrveSettings() {
  const navigate = useNavigate();
  const { data: config, isLoading: configLoading } = useSyrveConfig();
  const { data: stores } = useSyrveStores();
  const testConnection = useTestSyrveConnection();
  const saveConfig = useSaveSyrveConfig();

  const [serverUrl, setServerUrl] = useState('');
  const [apiLogin, setApiLogin] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [testStores, setTestStores] = useState<any[]>([]);
  const [passwordHash, setPasswordHash] = useState('');
  const [tested, setTested] = useState(false);

  // Initialize from config
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
      setTested(true);
      toast.success(`Connection successful! Found ${result.stores?.length || 0} stores.`);
    } catch (err: any) {
      toast.error(err.message || 'Connection failed');
      setTested(false);
    }
  };

  const handleSave = async () => {
    if (!passwordHash) {
      toast.error('Test connection first');
      return;
    }
    const selectedStore = testStores.find(s => s.id === selectedStoreId);
    try {
      await saveConfig.mutateAsync({
        server_url: serverUrl.replace(/\/$/, ''),
        api_login: apiLogin,
        api_password_hash: passwordHash,
        default_store_id: selectedStoreId || undefined,
        default_store_name: selectedStore?.name || undefined,
      });
      toast.success('Syrve configuration saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  if (configLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Syrve Integration</h1>
          <p className="text-muted-foreground">Connect to your Syrve Server API for product sync</p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConfigured ? (
                <Wifi className="w-5 h-5 text-primary" />
              ) : (
                <WifiOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>
                  {isConfigured
                    ? `Connected to ${config?.server_url} • Store: ${config?.default_store_name || 'Not selected'}`
                    : 'Not configured'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConfigured ? 'default' : 'secondary'}>
              {isConfigured ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            {isConfigured ? 'Update Connection' : 'New Connection'}
          </CardTitle>
          <CardDescription>
            Enter your Syrve Server API credentials. The password will be stored as a SHA1 hash.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server_url">Server URL</Label>
            <Input
              id="server_url"
              placeholder={config?.server_url || 'https://your-server.syrve.online:443/resto/api'}
              value={serverUrl}
              onChange={(e) => { setServerUrl(e.target.value); setTested(false); }}
            />
            <p className="text-xs text-muted-foreground">Base URL of your Syrve Server API (e.g. https://parra.syrve.online:443/resto/api)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api_login">API Login</Label>
              <Input
                id="api_login"
                placeholder={config?.api_login || 'admin'}
                value={apiLogin}
                onChange={(e) => { setApiLogin(e.target.value); setTested(false); }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_password">API Password</Label>
              <Input
                id="api_password"
                type="password"
                placeholder="Enter password"
                value={apiPassword}
                onChange={(e) => { setApiPassword(e.target.value); setTested(false); }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleTestConnection}
              disabled={testConnection.isPending || !serverUrl || !apiLogin || !apiPassword}
              variant="outline"
            >
              {testConnection.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : tested ? (
              <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>

          {/* Store Selection */}
          {tested && testStores.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Default Store (Warehouse)
              </Label>
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a store for inventory operations" />
                </SelectTrigger>
                <SelectContent>
                  {testStores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name} {store.code ? `(${store.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This store will be used for stock queries and inventory document submissions.
              </p>
            </div>
          )}

          {tested && (
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saveConfig.isPending}>
                {saveConfig.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Configuration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Stores */}
      {isConfigured && stores && stores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Synced Stores ({stores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stores.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{store.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {store.code && `Code: ${store.code} • `}
                      {store.store_type && `Type: ${store.store_type}`}
                    </p>
                  </div>
                  {config?.default_store_id === store.syrve_store_id && (
                    <Badge variant="default">Default</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link to Sync page */}
      {isConfigured && (
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/settings/syrve/sync')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Sync Management</h3>
              <p className="text-sm text-muted-foreground">Run sync operations and view sync history</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
