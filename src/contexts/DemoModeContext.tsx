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
      toast.info(newValue ? "Demo Mode aktif" : "Demo Mode nonaktif", {
        duration: 2000,
      });
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
