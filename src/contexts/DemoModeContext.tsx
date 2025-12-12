import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  demoLoading: boolean;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("demoMode") === "true";
    }
    return false;
  });
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("demoMode", isDemoMode.toString());
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const newValue = !prev;
      if (newValue) {
        toast.info("Demo Mode aktif - Data simulasi ditampilkan", {
          duration: 3000,
          icon: "🎭",
        });
      } else {
        toast.success("Demo Mode nonaktif - Data live", {
          duration: 3000,
          icon: "✅",
        });
      }
      return newValue;
    });
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode, demoLoading }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
}
