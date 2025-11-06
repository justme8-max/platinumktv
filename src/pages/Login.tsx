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
