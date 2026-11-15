import { describe, expect, it } from "vitest";

import { attemptDemoLogin } from "../../src/server/auth/demo-auth-store";

describe("authentication store credentials", () => {
  it("authenticates teacher with intila9a2027 and intila9a2026", async () => {
    const result2027 = await attemptDemoLogin(
      "teacher@demo.intila9a.local",
      "intila9a2027",
    );
    expect(result2027.ok).toBe(true);
    if (result2027.ok) {
      expect(result2027.result.session.principal.role).toBe("TEACHER");
      expect(result2027.result.session.principal.email).toBe("teacher@demo.intila9a.local");
    }

    const result2026 = await attemptDemoLogin(
      "teacher@demo.intila9a.local",
      "intila9a2026",
    );
    expect(result2026.ok).toBe(true);

    // Smart identifier resolution
    const shortIdResult = await attemptDemoLogin("teacher", "intila9a2027");
    expect(shortIdResult.ok).toBe(true);

    const enseignantResult = await attemptDemoLogin("enseignant", "intila9a2027");
    expect(enseignantResult.ok).toBe(true);

    // Any email with correct teacher password resolves to teacher
    const anyEmailResult = await attemptDemoLogin("prof.maths@ecole.tn", "intila9a2027");
    expect(anyEmailResult.ok).toBe(true);
  });

  it("authenticates director Fethi Omri with secret code", async () => {
    const result = await attemptDemoLogin(
      "director@demo.intila9a.local",
      "fethi****",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.session.principal.role).toBe("DIRECTOR");
      expect(result.result.session.principal.firstName).toBe("Fethi");
      expect(result.result.session.principal.lastName).toBe("Omri");
    }

    const aliasResult = await attemptDemoLogin(
      "fethi.omri@ecole-foussana.tn",
      "fethi****",
    );
    expect(aliasResult.ok).toBe(true);
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
