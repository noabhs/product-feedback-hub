"use client";
import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "ghost" | "text";
  size?: "sm" | "lg";
  loading?: boolean;
}

export function Button({ variant = "filled", size = "sm", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer",
        "rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary-500 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" && "h-9 px-4 text-sm",
        size === "lg" && "h-14 px-6 text-base",
        variant === "filled" && [
          "bg-brand-secondary-500 text-white",
          "hover:bg-brand-secondary-400 hover:shadow-cta",
          "active:bg-brand-secondary-600",
        ],
        variant === "ghost" && [
          "border border-brand-secondary-500 text-brand-secondary-600",
          "hover:bg-brand-secondary-500 hover:text-white",
        ],
        variant === "text" && "text-brand-secondary-600 hover:underline",
        className
      )}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
