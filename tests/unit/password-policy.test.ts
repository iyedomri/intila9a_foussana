import { describe, expect, it } from "vitest";

import { loginSchema, passwordSchema } from "../../src/server/auth/password-policy";

describe("password policy", () => {
  it("accepts a password with all required character groups", () => {
    expect(passwordSchema.safeParse("Secure!School2026").success).toBe(true);
  });

  it("rejects weak or incomplete passwords", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("alllowercase123!").success).toBe(false);
    expect(passwordSchema.safeParse("NOLOWERCASE123!").success).toBe(false);
    expect(passwordSchema.safeParse("NoNumberOrSymbol").success).toBe(false);
  });

  it("normalizes the login identifier and rejects extra input", () => {
    const parsed = loginSchema.safeParse({
      email: "  PARENT@DEMO.INTILA9A.LOCAL ",
      password: "Demo!Parent2026",
      role: "DIRECTOR",
    });

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.email).toBe("parent@demo.intila9a.local");
      expect("role" in parsed.data).toBe(false);
    }

    const shortId = loginSchema.safeParse({
      email: "teacher",
      password: "intila9a2027",
    });
    expect(shortId.success).toBe(true);
  });
});
