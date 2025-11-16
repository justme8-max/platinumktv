import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  actions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }>;
  onClick?: () => void;
  className?: string;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}

export function FloatingActionButton({
  icon,
  actions,
  onClick,
  className,
  position = "bottom-right",
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  };

  const handleMainClick = () => {
    if (actions && actions.length > 0) {
      setIsOpen(!isOpen);
    } else {
      onClick?.();
    }
  };

  const handleActionClick = (actionOnClick: () => void) => {
    actionOnClick();
    setIsOpen(false);
  };

  return (
    <div className={cn("fixed z-50", positionClasses[position])}>
      <AnimatePresence>
        {isOpen && actions && actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="bg-background text-foreground px-3 py-1 rounded-full text-sm whitespace-nowrap shadow-lg border">
                  {action.label}
                </span>
                <Button
                  size="icon"
                  onClick={() => handleActionClick(action.onClick)}
                  className="h-12 w-12 rounded-full shadow-lg"
                >
                  {action.icon}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="icon"
          onClick={handleMainClick}
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl",
            className
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="h-6 w-6" /> : icon}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}
