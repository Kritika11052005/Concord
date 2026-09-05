import type { Request, Response, NextFunction } from 'express';
import { RateLimiterPostgres, RateLimiterMemory } from 'rate-limiter-flexible';
import type { SpendGuard } from '@concord/core';
import { pool } from '../db/index.js';

// 1. Rate Limiters (Postgres-backed with in-memory fallback if pool unavailable)
let limiterPerMin: RateLimiterPostgres | RateLimiterMemory;
let limiterPerDay: RateLimiterPostgres | RateLimiterMemory;

try {
  limiterPerMin = new RateLimiterPostgres({
    storeClient: pool,
    keyPrefix: 'rl_min',
    tableName: 'rate_limits',
    tableCreated: true,
    points: 60, // 60 requests
    duration: 60, // per 60 seconds
  });

  limiterPerDay = new RateLimiterPostgres({
    storeClient: pool,
    keyPrefix: 'rl_day',
    tableName: 'rate_limits',
    tableCreated: true,
    points: 2000, // 2000 requests
    duration: 86400, // per 24 hours (day)
  });
} catch {
  limiterPerMin = new RateLimiterMemory({
    keyPrefix: 'rl_min_mem',
    points: 60,
    duration: 60,
  });
  limiterPerDay = new RateLimiterMemory({
    keyPrefix: 'rl_day_mem',
    points: 2000,
    duration: 86400,
  });
}

// 2. Global LLM Concurrency Cap: 20 in flight
export const MAX_CONCURRENT_LLM_CALLS = 20;
let activeInFlightLLMCalls = 0;

export function getActiveInFlightCount(): number {
  return activeInFlightLLMCalls;
}

export function concurrencyLimiter(req: Request, res: Response, next: NextFunction): void {
  if (activeInFlightLLMCalls >= MAX_CONCURRENT_LLM_CALLS) {
    res.set('Retry-After', '1');
    res.status(429).json({
      error: {
        code: 'CONCURRENCY_LIMIT_EXCEEDED',
        message: `Global LLM concurrency cap (${MAX_CONCURRENT_LLM_CALLS} in flight) reached. Please retry shortly.`,
        retry_after_seconds: 1,
      },
    });
    return;
  }

  activeInFlightLLMCalls++;
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      activeInFlightLLMCalls = Math.max(0, activeInFlightLLMCalls - 1);
    }
  };

  res.on('finish', release);
  res.on('close', release);
  next();
}

// 3. Daily Spend Guard
export class PostgresSpendGuard implements SpendGuard {
  private ceiling: number;

  constructor(ceiling?: number) {
    const envCeiling = process.env.LLM_DAILY_CALL_CEILING;
    this.ceiling = ceiling ?? (envCeiling ? parseInt(envCeiling, 10) : 1000);
  }

  getCeiling(): number {
    return this.ceiling;
  }

  setCeiling(newCeiling: number): void {
    this.ceiling = newCeiling;
  }

  private getTodayBucketKey(): string {
    const today = new Date().toISOString().split('T')[0];
    return `spend_ceiling:${today}`;
  }

  async getTodayCount(): Promise<number> {
    try {
      const bucketKey = this.getTodayBucketKey();
      const res = await pool.query(
        `SELECT tokens FROM rate_limit_buckets WHERE bucket_key = $1`,
        [bucketKey]
      );
      if (res.rows.length === 0) return 0;
      return Number(res.rows[0].tokens) || 0;
    } catch {
      return 0;
    }
  }

  async canSpend(): Promise<boolean> {
    const count = await this.getTodayCount();
    if (count >= this.ceiling) {
      console.warn(
        `[SpendGuard] Daily LLM spend ceiling (${this.ceiling}) hit. Current count: ${count}. Skipping remote API call.`
      );
      return false;
    }
    return true;
  }

  async recordSpend(): Promise<void> {
    try {
      const bucketKey = this.getTodayBucketKey();
      await pool.query(
        `INSERT INTO rate_limit_buckets (bucket_key, tokens, updated_at)
         VALUES ($1, 1, now())
         ON CONFLICT (bucket_key)
         DO UPDATE SET tokens = rate_limit_buckets.tokens + 1, updated_at = now()`,
        [bucketKey]
      );
    } catch (err: any) {
      console.warn('[SpendGuard] Failed to record spend in database:', err.message);
    }
  }
}

export const spendGuard = new PostgresSpendGuard();

// 4. Rate Limiter Middleware
export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'] as string | undefined;
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
  let clientIdentifier = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    clientIdentifier = `key:${authHeader.slice(7).trim()}`;
  } else if (apiKeyHeader) {
    clientIdentifier = `key:${apiKeyHeader.trim()}`;
  } else {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    clientIdentifier = `ip:${ip}`;
  }

  try {
    // Check 60/min limit
    const resMin = await limiterPerMin.consume(clientIdentifier, 1);
    // Check 2000/day limit
    const resDay = await limiterPerDay.consume(clientIdentifier, 1);

    res.set('X-RateLimit-Limit-Minute', '60');
    res.set('X-RateLimit-Remaining-Minute', String(resMin.remainingPoints));
    res.set('X-RateLimit-Limit-Day', '2000');
    res.set('X-RateLimit-Remaining-Day', String(resDay.remainingPoints));

    next();
  } catch (rej: any) {
    if (rej && typeof rej.msBeforeNext !== 'undefined') {
      const retryAfter = Math.ceil(rej.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Reset', new Date(Date.now() + rej.msBeforeNext).toISOString());
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Allowance is 60 requests/minute and 2,000 requests/day per API key.',
          retry_after_seconds: retryAfter,
        },
      });
      return;
    }
    // On unexpected store failure, fail open so business traffic isn't dropped by DB glitch
    console.warn('[RateLimiter] Database rate limit consume failed, proceeding fail-open:', rej);
    next();
  }
}
