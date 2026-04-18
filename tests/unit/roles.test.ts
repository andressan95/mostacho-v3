import { describe, expect, it } from "vitest";

import {
  canAccessPath,
  hasRole,
  pickRoleHome,
  ROLE_HOME,
} from "@/lib/auth/roles";

describe("pickRoleHome", () => {
  it("prioriza admin sobre barber y client", () => {
    expect(pickRoleHome(["client", "barber", "admin"])).toBe(ROLE_HOME.admin);
  });

  it("prioriza barber sobre client cuando no hay admin", () => {
    expect(pickRoleHome(["client", "barber"])).toBe(ROLE_HOME.barber);
  });

  it("devuelve /client cuando solo hay client", () => {
    expect(pickRoleHome(["client"])).toBe(ROLE_HOME.client);
  });

  it("devuelve /client como fallback si no hay roles", () => {
    expect(pickRoleHome([])).toBe(ROLE_HOME.client);
  });
});

describe("hasRole", () => {
  it("detecta correctamente el rol solicitado", () => {
    expect(hasRole(["client", "barber"], "barber")).toBe(true);
    expect(hasRole(["client"], "admin")).toBe(false);
  });
});

describe("canAccessPath", () => {
  it("permite admin a /admin", () => {
    expect(canAccessPath(["admin"], "/admin/settings")).toBe(true);
  });

  it("bloquea barber en /admin", () => {
    expect(canAccessPath(["barber"], "/admin/clients")).toBe(false);
  });

  it("permite admin en /barber (cascada admin→barber)", () => {
    expect(canAccessPath(["admin"], "/barber/new-visit")).toBe(true);
  });

  it("permite barber en /client (cascada barber→client)", () => {
    expect(canAccessPath(["barber"], "/client/history")).toBe(true);
  });

  it("bloquea client en /barber", () => {
    expect(canAccessPath(["client"], "/barber")).toBe(false);
  });

  it("permite rutas públicas para cualquier combinación", () => {
    expect(canAccessPath([], "/raffles")).toBe(true);
    expect(canAccessPath([], "/")).toBe(true);
  });
});
