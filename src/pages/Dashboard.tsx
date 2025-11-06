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
};

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
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

        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (userRoles && userRoles.length > 0) {
          const roles = userRoles.map(r => r.role as string);
          setAvailableRoles(roles);
          
          // Check if there's a stored role preference
          const storedRole = sessionStorage.getItem('selectedRole');
          if (storedRole && roles.includes(storedRole)) {
            setRole(storedRole);
          } else {
            setRole(roles[0]);
          }
        } else {
          setRole(null);
          setAvailableRoles([]);
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

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    sessionStorage.setItem('selectedRole', newRole);
    toast.success(`Switched to ${newRole} role`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const DashboardComponent = role ? dashboardComponents[role] : null;

  if (DashboardComponent) {
    return (
      <>
        <DashboardComponent />
        {availableRoles.length > 1 && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-card border border-border rounded-lg shadow-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">Switch Role:</p>
              <select 
                value={role} 
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </>
    );
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
