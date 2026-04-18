import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leading, trailing, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <label className="flex flex-col gap-1.5">
        {label ? (
          <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
            {label}
          </span>
        ) : null}
        <span
          className={cn(
            "flex items-center gap-2 rounded-xl border border-[color:var(--color-glass-border)] bg-[color:var(--color-glass-bg)] px-3.5 py-2.5 text-[color:var(--color-text-primary)] backdrop-blur-md transition-colors",
            "focus-within:border-[color:var(--color-purple-vivid)] focus-within:ring-2 focus-within:ring-[color:var(--color-purple-vivid)]/40",
            error && "border-[color:var(--color-danger)]/60",
          )}
        >
          {leading ? (
            <span className="text-[color:var(--color-text-muted)]">{leading}</span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-transparent text-sm placeholder:text-[color:var(--color-text-muted)] outline-none",
              className,
            )}
            {...rest}
          />
          {trailing ? <span className="text-[color:var(--color-text-muted)]">{trailing}</span> : null}
        </span>
        {error ? (
          <span className="text-xs text-[color:var(--color-danger)]">{error}</span>
        ) : hint ? (
          <span className="text-xs text-[color:var(--color-text-muted)]">{hint}</span>
        ) : null}
      </label>
    );
  },
);
Input.displayName = "Input";
