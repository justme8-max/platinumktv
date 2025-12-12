import { useDemoMode } from "@/contexts/DemoModeContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DemoModeToggleProps {
  className?: string;
}

export default function DemoModeToggle({ className }: DemoModeToggleProps) {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <button
      onClick={toggleDemoMode}
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300",
        "border text-sm font-medium",
        isDemoMode 
          ? "bg-primary/10 border-primary text-primary" 
          : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {/* Animated indicator dot */}
      <motion.span
        className={cn(
          "h-2 w-2 rounded-full",
          isDemoMode ? "bg-primary" : "bg-muted-foreground/50"
        )}
        animate={isDemoMode ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <span className="tracking-wide">
        {isDemoMode ? "DEMO" : "LIVE"}
      </span>
    </button>
  );
}
