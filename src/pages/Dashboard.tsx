import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import OwnerDashboard from "@/components/dashboard/OwnerDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import CashierDashboard from "@/components/dashboard/CashierDashboard";
import WaiterDashboard from "@/components/dashboard/WaiterDashboard";
import AccountantDashboard from "@/components/dashboard/AccountantDashboard";

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserRole();
  }, []);

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
        .eq("user_id", user.id)
        .single();

      if (userRoles) {
        setRole(userRoles.role);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === "owner") return <OwnerDashboard />;
  if (role === "manager") return <ManagerDashboard />;
  if (role === "cashier") return <CashierDashboard />;
  if (role === "waiter" || role === "waitress") return <WaiterDashboard />;
  if (role === "accountant") return <AccountantDashboard />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">No Role Assigned</h2>
        <p className="text-muted-foreground">Please contact an administrator to assign you a role.</p>
      </div>
    </div>
  );
}
