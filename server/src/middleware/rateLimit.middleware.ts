import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Neither /auth/register nor /auth/login had any request throttling at
// all before this - a script could hammer /login with password guesses,
// or /register to mass-create accounts, as fast as the network would
// allow. Keyed by IP (the default), which is the right unit for "is
// something hammering this endpoint" even though it also means every
// legitimate user behind the same NAT/office IP shares one bucket - an
// acceptable tradeoff for a capstone project without per-account/CAPTCHA
// infrastructure. A short 1-minute window (rather than the more
// traditional 15 minutes) is deliberate: it still makes a brute-force
// script slow to the point of uselessness, but a developer who trips it
// only waits a minute, not a quarter hour.
//
// The real cap is 6/window (env.authRateLimit.max, see env.ts) -
// deliberately tight. That's tighter than a single run of
// auth.api.test.ts (8 register calls) or loginTiming.api.test.ts (10
// login calls) can fit under, so both CI and local test runs need
// AUTH_RATE_LIMIT_MAX set to something generous while running the normal
// test suite - only rateLimit.api.test.ts itself should run against the
// real, unset default (see tests/README.md).
//
// Separate limiter instances (not one shared between both routes) so
// hammering one endpoint doesn't also throttle the other.
function tooManyRequestsHandler(_req: Request, res: Response) {
  res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
}

export const registerRateLimiter = rateLimit({
  windowMs: env.authRateLimit.windowMs,
  max: env.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const loginRateLimiter = rateLimit({
  windowMs: env.authRateLimit.windowMs,
  max: env.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});
