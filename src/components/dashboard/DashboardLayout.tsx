import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Music } from "lucide-react";
import dashboardBg from "@/assets/dashboard-background.svg";
import employeeBg from "@/assets/employee-background.svg";
import employeeMobileBg from "@/assets/employee-mobile-background.svg";
import employeeMobileDarkBg from "@/assets/employee-mobile-dark-background.svg";
import employeeDashboardLightBg from "@/assets/employee-dashboard-light-background.svg";
import employeeDashboardDarkBg from "@/assets/employee-dashboard-dark-background.svg";
import ownerLightBg from "@/assets/owner-light-background.svg";
import ownerDarkBg from "@/assets/owner-dark-background.svg";
import ownerBg from "@/assets/owner-background.svg";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { NotificationCenter } from "@/components/common/NotificationCenter";

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate("/login");
  };

  // Select background based on role, screen size, and theme
  const getBackgroundImage = () => {
    const isDark = theme === 'dark';
    
    if (role === 'owner') {
      if (isMobile) return ownerBg;
      return isDark ? ownerDarkBg : ownerLightBg;
    }
    
    if (role === 'waiter' || role === 'cashier' || role === 'accountant' || role === 'manager') {
      if (isMobile) {
        return isDark ? employeeMobileDarkBg : employeeMobileBg;
      }
      return isDark ? employeeDashboardDarkBg : employeeDashboardLightBg;
    }
    
    return dashboardBg;
  };

  const isEmployee = role === 'waiter' || role === 'cashier' || role === 'accountant' || role === 'manager';

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `url(${getBackgroundImage()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <header className="border-b border-border bg-card/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide">Platinum High KTV</h1>
              <p className="text-xs text-muted-foreground capitalize font-semibold">{role === "cashier" ? "Kasir" : role === "waiter" ? "Pelayan" : role === "manager" ? "Manajer" : role === "owner" ? "Pemilik" : role} Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
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
