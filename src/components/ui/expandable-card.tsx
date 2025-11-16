import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface ExpandableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  expandedClassName?: string;
}

export function ExpandableCard({
  expanded = false,
  onExpandChange,
  trigger,
  children,
  className,
  expandedClassName,
  ...props
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded && "shadow-xl scale-[1.02]",
        className
      )}
      {...props}
    >
      <div onClick={handleToggle} className="cursor-pointer">
        {trigger}
      </div>
      
      <div
        ref={contentRef}
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn("p-4 animate-fade-in", expandedClassName)}>
          {children}
        </div>
      </div>
    </Card>
  );
}
