import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Wine, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
      {/* Left: Decorative */}
      <div className="hidden lg:flex lg:w-1/2 wine-gradient relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(350_55%_38%_/_0.4),transparent_60%)]" />
        <div className="relative z-10 text-center px-12">
          <Wine className="w-20 h-20 mx-auto mb-6 text-wine-gold opacity-80" />
          <h2 className="font-heading text-5xl font-bold text-wine-cream mb-4">Cellar</h2>
          <p className="text-lg text-wine-cream/70 max-w-md">
            Smart wine inventory management with AI-powered recognition
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/30 to-transparent" />
      </div>

      {/* Right: Role selection */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl wine-gradient flex items-center justify-center">
              <Wine className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Cellar</h1>
          </div>

          <h2 className="font-heading text-3xl font-bold mb-2">Welcome</h2>
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
        </div>
      </div>
    </div>
  );
}
