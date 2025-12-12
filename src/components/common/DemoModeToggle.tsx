import { Switch } from "@/components/ui/switch";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface DemoModeToggleProps {
  className?: string;
}

export default function DemoModeToggle({ className }: DemoModeToggleProps) {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Play className={cn(
        "h-4 w-4 transition-colors",
        isDemoMode ? "text-primary fill-primary" : "text-muted-foreground"
      )} />
      <span className={cn(
        "text-sm font-medium transition-colors",
        isDemoMode ? "text-primary" : "text-muted-foreground"
      )}>
        Demo
      </span>
      <Switch
        checked={isDemoMode}
        onCheckedChange={toggleDemoMode}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
