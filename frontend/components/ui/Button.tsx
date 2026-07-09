import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  glass?: boolean;
}

export const Button = ({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  glass = true,
  children,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: [
      "bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600",
      "hover:from-blue-500 hover:via-blue-400 hover:to-purple-500",
      "text-white font-semibold",
      "shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:shadow-xl",
      "border-0",
      "shimmer-btn",
    ].join(" "),
    secondary: [
      "bg-gradient-to-r from-blue-500/15 to-purple-500/15",
      "hover:from-blue-500/25 hover:to-purple-500/25",
      "text-white/80 hover:text-white",
      "border border-white/[0.06] hover:border-white/[0.10]",
      "backdrop-blur-sm",
    ].join(" "),
    outline: [
      "bg-white/[0.03] hover:bg-white/[0.06]",
      "text-white/60 hover:text-white/80",
      "border border-white/[0.06] hover:border-white/[0.12]",
      "backdrop-blur-sm",
    ].join(" "),
    ghost: [
      "bg-transparent hover:bg-white/[0.04]",
      "text-white/45 hover:text-white/70",
      "border-transparent",
    ].join(" "),
    danger: [
      "bg-gradient-to-r from-red-600 to-rose-600",
      "hover:from-red-500 hover:to-rose-500",
      "text-white font-semibold",
      "shadow-lg shadow-red-500/25 hover:shadow-red-500/35",
      "border-0",
      "shimmer-btn",
    ].join(" "),
    success: [
      "bg-gradient-to-r from-emerald-600 to-green-600",
      "hover:from-emerald-500 hover:to-green-500",
      "text-white font-semibold",
      "shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35",
      "border-0",
      "shimmer-btn",
    ].join(" "),
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl",
    icon: "p-2.5 rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-300",
        "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        "relative overflow-hidden",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  );
};
