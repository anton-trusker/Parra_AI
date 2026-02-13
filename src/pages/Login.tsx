import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import loginHero from '@/assets/login-hero.jpg';

const REMEMBER_KEY = 'parra_remember_me';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Restore remembered credentials
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.username) setUsername(parsed.username);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  const saveRemember = () => {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, username }));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Email and password required'); return; }
    setLoading(true);
    saveRemember();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed in successfully');
      navigate('/dashboard');
    }
  };

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Username and password required'); return; }
    setLoading(true);
    saveRemember();
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-login-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        toast.success('Signed in successfully');
        navigate('/dashboard');
      }
    } catch {
      toast.error('Login failed');
    }
    setLoading(false);
  };

  const passwordField = (
    <div className="space-y-1.5">
      <Label>Password</Label>
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-12 bg-secondary border-border pr-10"
          disabled={loading}
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
  );

  const rememberMeField = (
    <div className="flex items-center gap-2">
      <Checkbox
        id="remember-me"
        checked={rememberMe}
        onCheckedChange={(v) => setRememberMe(!!v)}
      />
      <label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer select-none">
        Remember me
      </label>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left: Hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end justify-start">
        <img
          src={loginHero}
          alt="Elegant restaurant interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative z-10 p-12 pb-16 max-w-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-wine-gold" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-wine-gold">AI-Powered</span>
          </div>
          <h2 className="font-heading text-5xl font-bold text-white mb-3 leading-tight">Parra</h2>
          <p className="text-lg text-white/70 leading-relaxed">
            Smart restaurant management with AI-powered tools
          </p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl wine-gradient flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Parra</h1>
          </div>

          <h2 className="font-heading text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your account</p>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="email" className="flex-1 gap-2"><Mail className="w-4 h-4" /> Email</TabsTrigger>
              <TabsTrigger value="username" className="flex-1 gap-2"><User className="w-4 h-4" /> Username</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 bg-secondary border-border"
                    disabled={loading}
                  />
                </div>
                {passwordField}
                {rememberMeField}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 wine-gradient text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity gap-3"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="username">
              <form onSubmit={handleUsernameLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Username</Label>
                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Your username"
                    className="h-12 bg-secondary border-border"
                    disabled={loading}
                  />
                </div>
                {passwordField}
                {rememberMeField}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 wine-gradient text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity gap-3"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center mt-10">
            © {new Date().getFullYear()} Trusker Solutions · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
