import React from "react";
import { cn } from "@/lib/utils";

type InputProps = {
  className?: string;
  label?: string;
  error?: string;
  as?: "input" | "textarea";
} & React.InputHTMLAttributes<HTMLInputElement>;

type TextareaProps = {
  className?: string;
  label?: string;
  error?: string;
  as?: "textarea";
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type CombinedInputProps = InputProps | TextareaProps;

export const Input = ({
  className,
  label,
  error,
  as,
  ...props
}: CombinedInputProps) => {
  const Component = as === "textarea" ? "textarea" : "input";
  const inputClasses = cn(
    "flex w-full rounded-xl",
    "border border-white/[0.06]",
    "bg-white/[0.03] backdrop-blur-sm",
    "px-4 py-3 text-sm text-white/85 placeholder-white/20",
    "outline-none transition-all duration-300",
    "focus:border-blue-500/30 focus:bg-blue-500/[0.04]",
    "focus:shadow-[0_0_0_3px_rgba(99,102,241,0.06),0_0_24px_rgba(99,102,241,0.06),0_0_48px_rgba(99,102,241,0.02)]",
    "hover:border-white/[0.10] hover:bg-white/[0.04]",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "disabled:cursor-not-allowed disabled:opacity-50",
    error && "border-red-500/30 focus:border-red-500/40 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.06),0_0_20px_rgba(239,68,68,0.06)]",
    className
  );

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35 leading-none">
          {label}
        </label>
      )}
      {Component === "textarea" ? (
        <textarea
          className={cn(inputClasses, "min-h-[100px] resize-y")}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={inputClasses}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <p className="text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
};
