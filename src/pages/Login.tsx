import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ShieldCheck, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import loginHero from '@/assets/login-hero.jpg';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = (role: 'admin' | 'staff') => {
    const creds = role === 'admin'
      ? { email: 'admin@wine.com', password: 'admin123' }
      : { email: 'staff@wine.com', password: 'staff123' };
    const success = login(creds.email, creds.password);
    if (success) {
      toast.success(`Signed in as ${role}`);
      navigate('/dashboard');
    }
  };

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

      {/* Right: Role selection */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl wine-gradient flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Parra</h1>
          </div>

          <h2 className="font-heading text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Choose your role to continue</p>

          <div className="space-y-4">
            <Button
              onClick={() => handleLogin('admin')}
              className="w-full h-14 wine-gradient text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity gap-3"
            >
              <ShieldCheck className="w-5 h-5" />
              Sign in as Admin
            </Button>
            <Button
              onClick={() => handleLogin('staff')}
              variant="outline"
              className="w-full h-14 font-semibold text-base gap-3 border-border"
            >
              <User className="w-5 h-5" />
              Sign in as Staff
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-10">
            © {new Date().getFullYear()} Parra · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
