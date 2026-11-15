import { describe, expect, it } from "vitest";

import { attemptDemoLogin } from "../../src/server/auth/demo-auth-store";

describe("demo auth store credentials", () => {
  it("authenticates teacher with Demo!Teacher2026", async () => {
    const result = await attemptDemoLogin(
      "teacher@demo.intila9a.local",
      "Demo!Teacher2026",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.session.principal.role).toBe("TEACHER");
      expect(result.result.session.principal.email).toBe("teacher@demo.intila9a.local");
    }
  });

  it("authenticates director with Demo!Director2026", async () => {
    const result = await attemptDemoLogin(
      "director@demo.intila9a.local",
      "Demo!Director2026",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.session.principal.role).toBe("DIRECTOR");
    }
  });

  it("authenticates student and parent demo accounts", async () => {
    const student = await attemptDemoLogin(
      "student@demo.intila9a.local",
      "Demo!Student2026",
    );
    expect(student.ok).toBe(true);

    const parent = await attemptDemoLogin(
      "parent@demo.intila9a.local",
      "Demo!Parent2026",
    );
    expect(parent.ok).toBe(true);
  });

  it("rejects invalid passwords", async () => {
    const wrong = await attemptDemoLogin(
      "teacher@demo.intila9a.local",
      "WrongPassword123!",
    );
    expect(wrong.ok).toBe(false);
  });
});
