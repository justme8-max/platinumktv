import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, Crown, Users, CreditCard, Coffee, Calculator } from "lucide-react";

type DemoAccount = {
  role: string;
  email: string;
  password: string;
  fullName: string;
  icon: typeof Crown;
  color: string;
  description: string;
};

const demoAccounts: DemoAccount[] = [
  {
    role: "owner",
    email: "demo-owner@platinumhigh.com",
    password: "Owner1234",
    fullName: "Demo Owner",
    icon: Crown,
    color: "from-yellow-500 to-orange-500",
    description: "Full access to all features",
  },
  {
    role: "manager",
    email: "demo-manager@platinumhigh.com",
    password: "Manager1234",
    fullName: "Demo Manager",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    description: "Manage operations & approve requests",
  },
  {
    role: "cashier",
    email: "demo-cashier@platinumhigh.com",
    password: "Cashier1234",
    fullName: "Demo Cashier",
    icon: CreditCard,
    color: "from-green-500 to-emerald-500",
    description: "Handle transactions & payments",
  },
  {
    role: "waiter",
    email: "demo-waiter@platinumhigh.com",
    password: "Waiter1234",
    fullName: "Demo Waiter",
    icon: Coffee,
    color: "from-purple-500 to-pink-500",
    description: "Manage orders & customer service",
  },
  {
    role: "accountant",
    email: "demo-accountant@platinumhigh.com",
    password: "Accountant1234",
    fullName: "Demo Accountant",
    icon: Calculator,
    color: "from-indigo-500 to-violet-500",
    description: "View reports & financial data",
  },
];

export default function DemoAccountsDialog() {
  const [loading, setLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = async (account: DemoAccount) => {
    setLoading(account.role);

    try {
      // Try to login first
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      // If login fails, create the account
      if (loginError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: {
            data: {
              full_name: account.fullName,
              phone: "",
            },
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (signUpError) throw signUpError;

        // The handle_new_user trigger automatically creates profile and assigns role
        // based on email pattern (demo-owner, demo-manager, etc.)

        // Now login
        if (signUpData.user) {
          const { error: loginError2 } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: account.password,
          });

          if (loginError2) throw loginError2;
        }
      }

      toast.success(`Login sebagai ${account.fullName} berhasil!`);
      setOpen(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Gagal demo login");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0 rounded-xl font-medium shadow-lg transition-all"
        >
          🚀 Demo Accounts (All Roles)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Demo Accounts</DialogTitle>
          <DialogDescription>
            Choose a role to test different features. Accounts are auto-created on first use.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            const isLoading = loading === account.role;
            
            return (
              <Button
                key={account.role}
                onClick={() => handleDemoLogin(account)}
                disabled={loading !== null}
                className={`h-auto p-4 bg-gradient-to-r ${account.color} text-white hover:opacity-90 border-0 rounded-xl shadow-md transition-all text-left justify-start`}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg capitalize">{account.role}</div>
                    <div className="text-sm text-white/90">{account.description}</div>
                    <div className="text-xs text-white/70 mt-1 truncate">
                      {account.email}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        <div className="text-sm text-muted-foreground">
          💡 Tip: All accounts use auto-generated secure passwords and are created on first login.
        </div>
      </DialogContent>
    </Dialog>
  );
}
