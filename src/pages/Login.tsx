import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Music } from "lucide-react";
import dashboardBg from "@/assets/dashboard-background.svg";
import { loginSchema } from "@/lib/validation";
import DemoAccountsDialog from "@/components/auth/DemoAccountsDialog";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input with zod
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        const firstError = validation.error.issues[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) throw error;

      toast.success("Selamat datang kembali!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Gagal masuk dengan Google");
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-start p-16 relative"
      style={{
        backgroundImage: `url(${dashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-sm relative z-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-semibold text-white tracking-tight">Platinum High KTV</h1>
          <p className="text-base text-white/80">
            Sign in to continue
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/90 text-sm font-normal">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-white/95 border-0 rounded-xl text-base shadow-sm focus-visible:ring-1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-white/90 text-sm font-normal">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-white/95 border-0 rounded-xl text-base shadow-sm focus-visible:ring-1"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 bg-white/95 text-foreground hover:bg-white rounded-xl font-medium shadow-sm transition-all"
            disabled={loading}
          >
            {loading ? "Masuk..." : "Masuk"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-white/60">atau</span>
          </div>
        </div>

        <DemoAccountsDialog />

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 bg-white/95 hover:bg-white border-0 rounded-xl font-medium shadow-sm transition-all"
          onClick={handleGoogleLogin}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Masuk dengan Google
        </Button>

        <div className="text-center">
          <p className="text-white/80 text-sm">
            Belum punya akun?{" "}
            <Link to="/register" className="text-white font-semibold hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
