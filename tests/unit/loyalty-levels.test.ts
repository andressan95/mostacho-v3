import { describe, expect, it } from "vitest";

import {
  getLevelMultiplier,
  getLoyaltyLevel,
  getNextMilestone,
} from "@/lib/domains/loyalty/levels";

const customSettings = {
  loyalty: {
    level_thresholds: {
      silver: 120,
      gold: 300,
      diamond: 900,
    },
    level_multipliers: {
      bronze: 1,
      silver: 1.2,
      gold: 1.4,
      diamond: 2,
    },
  },
};

describe("getLoyaltyLevel", () => {
  it("usa thresholds configurados por tenant", () => {
    expect(getLoyaltyLevel(50, customSettings)).toBe("bronze");
    expect(getLoyaltyLevel(120, customSettings)).toBe("silver");
    expect(getLoyaltyLevel(305, customSettings)).toBe("gold");
    expect(getLoyaltyLevel(1000, customSettings)).toBe("diamond");
  });
});

describe("getLevelMultiplier", () => {
  it("lee multiplicadores del tenant", () => {
    expect(getLevelMultiplier("gold", customSettings)).toBe(1.4);
  });
});

describe("getNextMilestone", () => {
  it("calcula el siguiente escalón disponible", () => {
    expect(getNextMilestone(150, customSettings)).toEqual({
      level: "gold",
      threshold: 300,
      remaining: 150,
    });
  });

  it("devuelve null cuando ya está en diamond", () => {
    expect(getNextMilestone(950, customSettings)).toBeNull();
  });
});
