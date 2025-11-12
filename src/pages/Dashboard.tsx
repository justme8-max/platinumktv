import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import OwnerDashboard from "@/components/dashboard/OwnerDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import CashierDashboard from "@/components/dashboard/CashierDashboard";
import WaiterDashboard from "@/components/dashboard/WaiterDashboard";
import AccountantDashboard from "@/components/dashboard/AccountantDashboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const dashboardComponents: { [key: string]: () => JSX.Element } = {
  owner: OwnerDashboard,
  manager: ManagerDashboard,
  cashier: CashierDashboard,
  waiter: WaiterDashboard,
  waitress: WaiterDashboard,
  accountant: AccountantDashboard,
  hrd: ManagerDashboard, // HRD uses manager dashboard
};

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login");
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleData) {
          setRole(roleData.role);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        toast.error(t('dashboard.role_check_error'));
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [navigate, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const DashboardComponent = role ? dashboardComponents[role] : null;

  if (DashboardComponent) {
    return <DashboardComponent />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t('dashboard.no_role_title')}</h2>
        <p className="text-muted-foreground">{t('dashboard.no_role_description')}</p>
      </div>
    </div>
  );
}
