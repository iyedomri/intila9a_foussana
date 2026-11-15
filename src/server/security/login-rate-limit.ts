import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 20;
const MAX_FAILURES_PER_ACCOUNT = 8;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface LoginRateLimitState {
  readonly byIp: Map<string, RateLimitEntry>;
  readonly byAccount: Map<string, RateLimitEntry>;
}

declare global {
  // eslint-disable-next-line no-var
  var __intila9aLoginRateLimitState: LoginRateLimitState | undefined;
}

function getState(): LoginRateLimitState {
  if (!globalThis.__intila9aLoginRateLimitState) {
    globalThis.__intila9aLoginRateLimitState = {
      byIp: new Map<string, RateLimitEntry>(),
      byAccount: new Map<string, RateLimitEntry>(),
    };
  }

  return globalThis.__intila9aLoginRateLimitState;
}

function getActiveEntry(
  entries: Map<string, RateLimitEntry>,
  key: string,
  now: number,
): RateLimitEntry | null {
  const entry = entries.get(key);

  if (!entry) {
    return null;
  }

  if (entry.resetAt <= now) {
    entries.delete(key);
    return null;
  }

  return entry;
}

function increment(entries: Map<string, RateLimitEntry>, key: string, now: number): void {
  const entry = getActiveEntry(entries, key, now);

  if (entry) {
    entry.count += 1;
    return;
  }

  entries.set(key, { count: 1, resetAt: now + WINDOW_MS });
}

export function isLoginRateLimited(ip: string, normalizedEmail: string): boolean {
  const now = Date.now();
  const state = getState();
  const ipEntry = getActiveEntry(state.byIp, ip, now);
  const accountEntry = getActiveEntry(state.byAccount, normalizedEmail, now);

  return (
    (ipEntry?.count ?? 0) >= MAX_FAILURES_PER_IP ||
    (accountEntry?.count ?? 0) >= MAX_FAILURES_PER_ACCOUNT
  );
}

export function recordFailedLogin(ip: string, normalizedEmail: string): void {
  const now = Date.now();
  const state = getState();
  increment(state.byIp, ip, now);
  increment(state.byAccount, normalizedEmail, now);
}

export function clearLoginRateLimit(normalizedEmail: string): void {
  getState().byAccount.delete(normalizedEmail);
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}
