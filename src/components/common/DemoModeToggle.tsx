import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { cn } from "@/lib/utils";
import { Sparkles, Database } from "lucide-react";

interface DemoModeToggleProps {
  variant?: "compact" | "full";
  className?: string;
}

export default function DemoModeToggle({ variant = "full", className }: DemoModeToggleProps) {
  const { isDemoMode, toggleDemoMode, demoLoading } = useDemoMode();

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Switch
          id="demo-mode-compact"
          checked={isDemoMode}
          onCheckedChange={toggleDemoMode}
          disabled={demoLoading}
          className="data-[state=checked]:bg-primary"
        />
        <Badge 
          variant={isDemoMode ? "default" : "outline"} 
          className={cn(
            "transition-all duration-300",
            isDemoMode ? "bg-primary text-primary-foreground" : ""
          )}
        >
          {isDemoMode ? (
            <><Sparkles className="h-3 w-3 mr-1" /> Demo</>
          ) : (
            <><Database className="h-3 w-3 mr-1" /> Live</>
          )}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl border bg-card transition-all duration-300",
      isDemoMode && "border-primary/50 bg-primary/5",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
          isDemoMode 
            ? "bg-primary/20 text-primary" 
            : "bg-muted text-muted-foreground"
        )}>
          {isDemoMode ? <Sparkles className="h-5 w-5" /> : <Database className="h-5 w-5" />}
        </div>
        <div>
          <Label htmlFor="demo-mode" className="font-semibold text-sm cursor-pointer">
            Demo Mode
          </Label>
          <p className="text-xs text-muted-foreground">
            {isDemoMode ? "Menampilkan data simulasi" : "Menampilkan data live"}
          </p>
        </div>
      </div>
      <Switch
        id="demo-mode"
        checked={isDemoMode}
        onCheckedChange={toggleDemoMode}
        disabled={demoLoading}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
