import * as React from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  threshold?: number;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 100,
  className,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-threshold, 0, threshold], [0.5, 1, 0.5]);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragEnd = (_event: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
  };

  return (
    <div className="relative">
      {/* Left Action Background */}
      {rightAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-start pl-4 bg-success rounded-lg"
          style={{
            opacity: useTransform(x, [0, threshold], [0, 1]),
          }}
        >
          {rightAction}
        </motion.div>
      )}

      {/* Right Action Background */}
      {leftAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-end pr-4 bg-destructive rounded-lg"
          style={{
            opacity: useTransform(x, [-threshold, 0], [1, 0]),
          }}
        >
          {leftAction}
        </motion.div>
      )}

      {/* Swipeable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        style={{ x, opacity }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative cursor-grab active:cursor-grabbing",
          isDragging && "z-10",
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}
