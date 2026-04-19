import { describe, expect, it } from "vitest";

import { normalizeQrToken } from "@/lib/domains/visits/tokens";

describe("normalizeQrToken", () => {
  it("recorta tokens simples", () => {
    expect(normalizeQrToken("  abc123  ")).toBe("abc123");
  });

  it("extrae token desde query string", () => {
    expect(
      normalizeQrToken("https://mostacho.app/client/scan?token=qr-987"),
    ).toBe("qr-987");
  });

  it("usa el último segmento de una URL si no hay query", () => {
    expect(
      normalizeQrToken("https://mostacho.app/redeem/prize-token-42"),
    ).toBe("prize-token-42");
  });
});
