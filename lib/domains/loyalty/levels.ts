import type { LoyaltyLevel } from "@/lib/supabase/database.types";
import {
  defaultTenantSettings,
  parseTenantSettings,
} from "@/lib/domains/settings/schema";

const LEVEL_ORDER: LoyaltyLevel[] = ["bronze", "silver", "gold", "diamond"];

export function getLevelThresholds(raw?: unknown) {
  return parseTenantSettings(raw ?? defaultTenantSettings).loyalty
    .level_thresholds;
}

export function getLevelMultipliers(raw?: unknown) {
  return parseTenantSettings(raw ?? defaultTenantSettings).loyalty
    .level_multipliers;
}

export function getLoyaltyLevel(
  points: number,
  raw?: unknown,
): LoyaltyLevel {
  const thresholds = getLevelThresholds(raw);

  if (points >= thresholds.diamond) return "diamond";
  if (points >= thresholds.gold) return "gold";
  if (points >= thresholds.silver) return "silver";
  return "bronze";
}

export function getLevelMultiplier(level: LoyaltyLevel, raw?: unknown) {
  return getLevelMultipliers(raw)[level];
}

export function getNextMilestone(
  points: number,
  raw?: unknown,
): {
  level: LoyaltyLevel;
  threshold: number;
  remaining: number;
} | null {
  const thresholds = getLevelThresholds(raw);
  const current = getLoyaltyLevel(points, raw);
  const currentIndex = LEVEL_ORDER.indexOf(current);

  const nextLevel = LEVEL_ORDER[currentIndex + 1];
  if (!nextLevel) return null;

  const threshold =
    nextLevel === "silver"
      ? thresholds.silver
      : nextLevel === "gold"
        ? thresholds.gold
        : thresholds.diamond;

  return {
    level: nextLevel,
    threshold,
    remaining: Math.max(threshold - points, 0),
  };
}
