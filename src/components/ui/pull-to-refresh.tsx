import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface PullToRefreshProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  shouldRefresh: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({
  isPulling,
  isRefreshing,
  pullDistance,
  shouldRefresh,
  children,
  className,
}: PullToRefreshProps) {
  const indicatorHeight = Math.min(pullDistance, 60);
  const rotation = (pullDistance / 80) * 360;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-background/80 backdrop-blur"
        animate={{
          height: isPulling || isRefreshing ? indicatorHeight : 0,
          opacity: isPulling || isRefreshing ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          animate={{
            rotate: isRefreshing ? 360 : rotation,
            scale: shouldRefresh ? 1.2 : 1,
          }}
          transition={{
            rotate: isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {},
            scale: { duration: 0.2 },
          }}
        >
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-primary" />
          ) : (
            <RefreshCw className={cn(
              "w-6 h-6 transition-colors",
              shouldRefresh ? "text-primary" : "text-muted-foreground"
            )} />
          )}
        </motion.div>
      </motion.div>
      
      <motion.div
        animate={{
          y: isPulling || isRefreshing ? indicatorHeight : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
