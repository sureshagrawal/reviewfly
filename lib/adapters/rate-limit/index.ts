/**
 * Rate limit adapter interface.
 *
 * - Memory backend ONLY for local dev (resets per process).
 * - Upstash Redis required in production (serverless = per-invocation reset).
 *
 * Phase 0: interface only.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
};

export interface RateLimitAdapter {
  readonly name: string;
  /**
   * @param key  bucket identifier (e.g. `ip:1.2.3.4`, `user:uuid`, `tenant:slug`)
   * @param limit  max events per window
   * @param windowSeconds  rolling window in seconds
   */
  check(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult>;
}
