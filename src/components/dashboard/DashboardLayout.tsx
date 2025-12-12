import { ReactNode, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Music, Moon, Sun, Settings } from "lucide-react";
import dashboardBg from "@/assets/dashboard-background.svg";
import employeeMobileBg from "@/assets/employee-mobile-background.svg";
import employeeMobileDarkBg from "@/assets/employee-mobile-dark-background.svg";
import employeeDashboardLightBg from "@/assets/employee-dashboard-light-background.svg";
import employeeDashboardDarkBg from "@/assets/employee-dashboard-dark-background.svg";
import ownerLightBg from "@/assets/owner-light-background.svg";
import ownerDarkBg from "@/assets/owner-dark-background.svg";
import ownerBg from "@/assets/owner-background.svg";
import { useTheme } from "next-themes";
import { useState, useEffect, useCallback } from "react";
import { NotificationCenter } from "@/components/common/NotificationCenter";
import DemoModeToggle from "@/components/common/DemoModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
}

const DashboardLayout = memo(function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate("/login");
  }, [navigate]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Memoized background selection
  const backgroundImage = useMemo(() => {
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
  }, [role, theme, isMobile]);

  const roleLabel = useMemo(() => {
    const labels: Record<string, string> = {
      cashier: "Kasir",
      waiter: "Pelayan",
      manager: "Manajer",
      owner: "Pemilik",
      accountant: "Akuntan",
    };
    return labels[role] || role;
  }, [role]);

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `url(${backgroundImage})`,
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
              <p className="text-xs text-muted-foreground font-semibold">{roleLabel} Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Demo Mode Toggle - Compact */}
            <DemoModeToggle variant="compact" className="hidden md:flex" />
            
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <NotificationCenter />
            
            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2 md:hidden">
                  <DemoModeToggle variant="compact" />
                </div>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <><Sun className="h-4 w-4 mr-2" /> Mode Terang</>
                  ) : (
                    <><Moon className="h-4 w-4 mr-2" /> Mode Gelap</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex">
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
});

export default DashboardLayout;
