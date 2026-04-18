"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const neonButton = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium tracking-wide",
    "rounded-full cursor-pointer select-none",
    "transition-[background,box-shadow,transform,opacity] duration-200",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-purple-primary text-text-primary",
          "hover:bg-purple-vivid",
          "hover:shadow-[0_0_24px_rgba(124,58,237,0.55)]",
        ],
        ghost: [
          "glass-panel text-text-primary",
          "hover:bg-purple-primary/20",
        ],
        outline: [
          "border border-purple-vivid/60 text-purple-soft",
          "hover:bg-purple-primary/10 hover:border-purple-vivid",
        ],
        danger: [
          "bg-danger/90 text-white",
          "hover:bg-danger hover:shadow-[0_0_24px_rgba(248,113,113,0.45)]",
        ],
      },
      size: {
        sm: "h-9 px-4 text-sm min-w-[44px]",
        md: "h-11 px-6 text-base min-w-[44px]",
        lg: "h-14 px-8 text-lg min-w-[44px]",
        icon: "h-11 w-11 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type NeonButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof neonButton>;

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  function NeonButton(
    { className, variant, size, fullWidth, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(neonButton({ variant, size, fullWidth }), className)}
        {...props}
      />
    );
  },
);
