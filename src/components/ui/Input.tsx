import { clsx } from "clsx";
import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ icon, className, ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary opacity-40 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={clsx(
          "w-full h-10 rounded-sm bg-white border border-black/15 px-3 text-sm text-brand-primary",
          "placeholder:text-brand-primary/40",
          "focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500",
          "transition-all duration-200",
          icon && "pl-9",
          className
        )}
      />
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function Select({ value, onChange, options, placeholder, className }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        "h-10 rounded-sm bg-white border border-black/15 px-3 text-sm text-brand-primary",
        "focus:outline-none focus:border-brand-secondary-500",
        "transition-all duration-200 cursor-pointer",
        className
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
