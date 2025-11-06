import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Music } from "lucide-react";
import dashboardBg from "@/assets/dashboard-background.svg";
import employeeBg from "@/assets/employee-background.svg";
import employeeMobileBg from "@/assets/employee-mobile-background.svg";
import ownerBg from "@/assets/owner-background.svg";

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate("/login");
  };

  // Select background based on role and screen size
  const getBackgroundImage = () => {
    if (role === 'owner') return ownerBg;
    if (role === 'waiter' || role === 'cashier' || role === 'accountant' || role === 'manager') return employeeBg;
    return dashboardBg;
  };

  const getMobileBackgroundImage = () => {
    if (role === 'waiter' || role === 'cashier' || role === 'accountant' || role === 'manager') return employeeMobileBg;
    return getBackgroundImage();
  };

  const isEmployee = role === 'waiter' || role === 'cashier' || role === 'accountant' || role === 'manager';

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundImage: isEmployee 
          ? `url(${getMobileBackgroundImage()})` 
          : `url(${getBackgroundImage()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {isEmployee && (
        <style>{`
          @media (min-width: 768px) {
            .min-h-screen {
              background-image: url(${employeeBg}) !important;
            }
          }
        `}</style>
      )}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">KTV Enterprise</h1>
              <p className="text-xs text-muted-foreground capitalize">{role} Dashboard</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
