import * as React from "react";
import { cn } from "@/lib/utils";

interface StaggeredGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function StaggeredGrid({
  children,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  className,
  ...props
}: StaggeredGridProps) {
  const gridClasses = cn(
    "grid gap-4 auto-rows-auto",
    `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    className
  );

  const items = React.Children.toArray(children);

  return (
    <div className={gridClasses} {...props}>
      {items.map((child, index) => (
        <div
          key={index}
          className="animate-fade-in"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: "backwards",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
