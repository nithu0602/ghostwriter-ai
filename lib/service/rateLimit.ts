/**
 * Simple in-memory sliding-window rate limiter, keyed by client IP.
 *
 * NOTE: State is per warm serverless instance only (same caveat as the
 * analysis cache) — it does not coordinate across concurrent Vercel
 * instances or survive cold starts. It's still useful as a first line of
 * defense against a single client hammering the endpoint and burning the
 * shared GITHUB_TOKEN's rate limit for everyone. For strict, globally
 * enforced limits, an external store (e.g. Upstash/Redis) would be needed.
 */

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10;

const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(
  key: string,
  windowMs: number = WINDOW_MS,
  maxRequests: number = MAX_REQUESTS_PER_WINDOW
): RateLimitResult {
  const now = Date.now();
  const timestamps = (requestLog.get(key) || []).filter(
    (ts) => now - ts < windowMs
  );

  if (timestamps.length >= maxRequests) {
    const oldestInWindow = timestamps[0];
    const retryAfterSeconds = Math.ceil((windowMs - (now - oldestInWindow)) / 1000);
    requestLog.set(key, timestamps);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return { allowed: true };
}

/**
 * Best-effort extraction of client IP from standard proxy headers.
 * Falls back to a constant when unavailable (e.g. local dev without a proxy).
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Test-only helper to reset rate limiter state between test cases.
 */
export function __resetRateLimitForTests(): void {
  requestLog.clear();
}

