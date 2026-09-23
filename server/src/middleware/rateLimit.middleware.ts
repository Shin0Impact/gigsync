import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

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
// while re-running the test suite a few times only waits a minute, not a
// quarter hour. The cap (20) comfortably clears a single real test run
// (auth.api.test.ts alone makes ~7 register + ~4 login calls) while still
// being far below what an actual attack script would try to do in the
// same window. Separate limiter instances (not one shared between both
// routes) so hammering one endpoint doesn't also throttle the other.
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 6;

function tooManyRequestsHandler(_req: Request, res: Response) {
  res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
}

export const registerRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});
