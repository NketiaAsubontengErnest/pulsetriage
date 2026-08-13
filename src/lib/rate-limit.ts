interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Sliding window rate limiter.
 * @param key Unique identifier (e.g. IP address or email)
 * @param maxHits Max allowed requests per window
 * @param windowMs Window duration in milliseconds (e.g. 15 minutes = 15 * 60 * 1000)
 */
export function checkRateLimit(key: string, maxHits = 5, windowMs = 15 * 60 * 1000): { isRateLimited: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { isRateLimited: false, remaining: maxHits - 1, resetMs: windowMs };
  }

  if (record.count >= maxHits) {
    return { isRateLimited: true, remaining: 0, resetMs: Math.max(0, record.resetAt - now) };
  }

  record.count += 1;
  return { isRateLimited: false, remaining: maxHits - record.count, resetMs: Math.max(0, record.resetAt - now) };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
