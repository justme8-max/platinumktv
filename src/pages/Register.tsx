import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Music, Loader2, ArrowLeft } from "lucide-react";
import registerBg from "@/assets/register-background-new.svg";
import { registerSchema } from "@/lib/validation";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [division, setDivision] = useState("");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input with zod
      const validation = registerSchema.safeParse({ 
        email, 
        password, 
        confirmPassword, 
        fullName, 
        phone,
        division
      });
      
      if (!validation.success) {
        const firstError = validation.error.issues[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validation.data.fullName,
            phone: validation.data.phone,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            full_name: validation.data.fullName,
            email: validation.data.email,
            phone: validation.data.phone || null,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        toast.success("Pendaftaran berhasil! Silakan login.");
        navigate("/login");
      }
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast.error("Email sudah terdaftar. Silakan login.");
      } else {
        toast.error(error.message || "Gagal mendaftar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 md:p-16 relative"
      style={{
        backgroundImage: `url(${registerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md relative z-10 space-y-6 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </Link>

        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Daftar Akun</h1>
          <p className="text-base text-white/80">
            Buat akun baru untuk mengakses sistem
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-white/90 text-sm font-normal">
              Nama Lengkap
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11 bg-white/95 border-0 rounded-xl text-base shadow-sm focus-visible:ring-1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/90 text-sm font-normal">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 bg-white/95 border-0 rounded-xl text-base shadow-sm focus-visible:ring-1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-white/90 text-sm font-normal">
              Nomor Telepon (Opsional)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 bg-white/95 border-0 rounded-xl text-base shadow-sm focus-visible:ring-1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="division" className="text-white/90 text-sm font-normal">
              Jabatan
            </Label>
            <Select value={division} onValueChange={setDivision} required>
              <SelectTrigger className="h-11 bg-white/95 border-0 rounded-xl text-base shadow-sm">
                <SelectValue placeholder="Pilih jabatan" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="cashier">Kasir</SelectItem>
                <SelectItem value="waiter">Pelayan</SelectItem>
                <SelectItem value="accountant">Akuntan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-white/90 text-sm font-normal">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 bg-white/95 border-0 rounded-xl text-base shadow-sm focus-visible:ring-1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-white/90 text-sm font-normal">
              Konfirmasi Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11 bg-white/95 border-0 rounded-xl text-base shadow-sm focus-visible:ring-1"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-white/95 text-foreground hover:bg-white rounded-xl font-medium shadow-sm transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mendaftar...
              </>
            ) : (
              "Daftar Sekarang"
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-white/80 text-sm">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-white font-semibold hover:underline">
              Login di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
