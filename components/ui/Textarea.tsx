import { forwardRef } from "react";
import type { ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, leading, className, id, ...rest }, ref) => {
    const fieldId = id ?? rest.name;

    return (
      <label className="flex flex-col gap-1.5">
        {label ? (
          <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
            {label}
          </span>
        ) : null}

        <span
          className={cn(
            "flex gap-2 rounded-2xl border border-[color:var(--color-glass-border)] bg-[color:var(--color-glass-bg)] px-3.5 py-3 text-[color:var(--color-text-primary)] backdrop-blur-md transition-colors",
            "focus-within:border-[color:var(--color-purple-vivid)] focus-within:ring-2 focus-within:ring-[color:var(--color-purple-vivid)]/40",
            error && "border-[color:var(--color-danger)]/60",
          )}
        >
          {leading ? (
            <span className="pt-1 text-[color:var(--color-text-muted)]">
              {leading}
            </span>
          ) : null}
          <textarea
            ref={ref}
            id={fieldId}
            className={cn(
              "min-h-24 w-full resize-y bg-transparent text-sm placeholder:text-[color:var(--color-text-muted)] outline-none",
              className,
            )}
            {...rest}
          />
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

Textarea.displayName = "Textarea";
