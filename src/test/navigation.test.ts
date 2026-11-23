import { describe, expect, it } from "vitest";

import { canAccess, effectiveRole, homeFor, navFor, ROLE_NAV } from "@/lib/navigation";
import { parsePrefs } from "@/lib/preferences";

describe("role-based navigation", () => {
  it("audit log is only open to operators and supervisors", () => {
    expect(canAccess("audit", "operator")).toBe(true);
    expect(canAccess("audit", "supervisor")).toBe(true);
    expect(canAccess("audit", "commuter")).toBe(false);
    expect(canAccess("audit", "emergency_driver")).toBe(false);
    expect(canAccess("audit", "guest")).toBe(false);
  });

  it("guests land on the commuter view", () => {
    expect(homeFor("guest")).toBe("/commuter");
  });

  it("operators and supervisors land on the control room", () => {
    expect(homeFor("operator")).toBe("/dashboard");
    expect(homeFor("supervisor")).toBe("/dashboard");
  });

  it("emergency drivers land on routes", () => {
    expect(homeFor("emergency_driver")).toBe("/routes");
  });

  it("mobile bar has exactly 4 module tabs plus More for every role", () => {
    for (const nav of Object.values(ROLE_NAV)) expect(nav.primary).toHaveLength(4);
  });

  it("highest-privilege role wins when a user holds several", () => {
    expect(effectiveRole(["commuter", "operator"], false)).toBe("operator");
    expect(effectiveRole(["commuter", "supervisor", "operator"], false)).toBe("supervisor");
  });

  it("signed-out non-guest has no role", () => {
    expect(effectiveRole([], false)).toBeNull();
    expect(effectiveRole([], true)).toBe("guest");
  });

  it("guest cannot open the operator control room", () => {
    expect(navFor("guest")).not.toContain("dashboard");
  });
});

describe("preferences parsing", () => {
  it("falls back to English, medium text and no high contrast", () => {
    expect(parsePrefs(null)).toMatchObject({ language: "en", textSize: "m", highContrast: false });
  });

  it("keeps Kannada and high contrast when stored", () => {
    expect(parsePrefs(JSON.stringify({ language: "kn", highContrast: true, textSize: "xl" }))).toMatchObject({
      language: "kn",
      highContrast: true,
      textSize: "xl",
    });
  });

  it("rejects unknown languages", () => {
    expect(parsePrefs(JSON.stringify({ language: "fr" })).language).toBe("en");
  });
});
