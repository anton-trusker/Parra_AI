import { useEffect, useState } from 'react';
import { useSyrveStore } from '@/stores/syrveStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Server, CheckCircle2, XCircle } from 'lucide-react';

export default function SyrveConnection() {
    const { config, connectionStatus, availableStores, fetchConfig, testConnection, saveConfig, loading } = useSyrveStore();

    const [url, setUrl] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [storeId, setStoreId] = useState<string>('');

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    useEffect(() => {
        if (config) {
            setUrl(config.serverUrl);
            setLogin(config.login);
            if (config.storeId) setStoreId(config.storeId);
        }
    }, [config]);

    const handleTest = async () => {
        if (!url || !login || !password) {
            toast.error('Please fill in all fields (including password) to test');
            return;
        }
        const success = await testConnection(url, login, password);
        if (success) {
            toast.success('Connection successful! Please select a store.');
        } else {
            // Read the error from the store state directly if possible, or we need to wait for the state update.
            // Since testConnection is async and sets state, we can use useSyrveStore.getState().errorMessage
            const error = useSyrveStore.getState().errorMessage;
            toast.error(`Connection failed: ${error || 'Check credentials'}`);
        }
    };

    const handleSave = async () => {
        try {
            if (!storeId && availableStores.length > 0) {
                toast.error('Please select a store');
                return;
            }

            await saveConfig({
                serverUrl: url,
                login,
                password: password || undefined, // Only send if changed
                storeId
            });
            toast.success('Configuration saved successfully');
        } catch (e: any) {
            // Check for Row Level Security (RLS) error which typically returns 401
            if (e.message?.includes('401') || e.code === '401' || e.message?.includes('row-level security policy')) {
                toast.error('Permission denied: You do not have access to save settings (RLS Policy).');
            } else {
                toast.error('Failed to save: ' + e.message);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Syrve Integration</h1>
                    <p className="text-muted-foreground mt-2">
                        Connect your Syrve (iiko) Server to sync products and inventory.
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium ${connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
                        connectionStatus === 'error' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                    }`}>
                    {connectionStatus === 'connected' ? <CheckCircle2 className="w-4 h-4" /> :
                        connectionStatus === 'error' ? <XCircle className="w-4 h-4" /> :
                            <Server className="w-4 h-4" />}
                    {connectionStatus.toUpperCase()}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Connection Settings</CardTitle>
                    <CardDescription>
                        Enter your Syrve server URL and API credentials.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Server URL</Label>
                            <Input
                                placeholder="https://api.syrve.live"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>API Login</Label>
                            <Input
                                placeholder="admin"
                                value={login}
                                onChange={e => setLogin(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>API Password</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter only if you want to change it or test connection.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Store</Label>
                            {availableStores.length > 0 ? (
                                <Select value={storeId} onValueChange={setStoreId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a store" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableStores.map(store => (
                                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input disabled placeholder="Test connection to load stores..." value={config?.storeId || ''} />
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={handleTest} disabled={loading || connectionStatus === 'testing'}>
                            {connectionStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Test Connection
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="wine-gradient">
                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Save Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
