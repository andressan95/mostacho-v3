import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  cents: number,
  options?: { locale?: string; currency?: string },
) {
  const locale = options?.locale ?? "es-CL";
  const currency = options?.currency ?? "CLP";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDateTime(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions & { locale?: string },
) {
  if (!value) return "—";

  const locale = options?.locale ?? "es-CL";
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: options?.timeStyle ?? undefined,
    ...options,
  }).format(date);
}

export function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseNumber(
  value: FormDataEntryValue | null,
  fallback = 0,
): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
