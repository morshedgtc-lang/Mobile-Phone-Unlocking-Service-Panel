import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  glass?: boolean;
}

export const Card = ({
  className,
  title,
  subtitle,
  footer,
  glass = true,
  children,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        glass
          ? "glass-card"
          : "bg-card text-card-foreground rounded-xl border border-border shadow-sm",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-white/[0.04]">
          {title && (
            <h3 className="text-sm font-bold leading-none tracking-tight text-gradient-primary">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-white/35 mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>
      )}
      <div className="p-6 relative z-10">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.04] rounded-b-2xl relative z-10">
          {footer}
        </div>
      )}
    </div>
  );
};
