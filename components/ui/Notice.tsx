import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type NoticeProps = {
  tone?: "info" | "success" | "danger";
  children: React.ReactNode;
  className?: string;
};

const TONE_STYLES = {
  info: {
    icon: Info,
    className:
      "border-[color:var(--color-purple-vivid)]/35 bg-[color:var(--color-purple-primary)]/10 text-[color:var(--color-text-secondary)]",
  },
  success: {
    icon: CheckCircle2,
    className:
      "border-[color:var(--color-success)]/35 bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]",
  },
  danger: {
    icon: AlertCircle,
    className:
      "border-[color:var(--color-danger)]/35 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]",
  },
};

export function Notice({
  tone = "info",
  children,
  className,
}: NoticeProps) {
  const Icon = TONE_STYLES[tone].icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        TONE_STYLES[tone].className,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
