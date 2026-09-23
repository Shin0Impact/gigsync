/**
 * API tests for rate limiting on /api/auth/register and /api/auth/login
 * (security fix: neither endpoint had any request throttling at all -
 * see src/middleware/rateLimit.middleware.ts for the reasoning behind the
 * window/cap chosen).
 *
 * Run with the server already running locally, then from server/:
 *
 *   npm run test:rate-limit
 *
 * Fires a burst of BURST_SIZE concurrent requests at each endpoint - well
 * above the configured cap (20/minute) regardless of a handful of calls
 * other test files might have already made against the same server in
 * the current window - and checks that some of them come back 429 while
 * the earliest ones still come back with their normal (non-rate-limited)
 * status. This intentionally uses payloads that fail validation (400) or
 * bad credentials (401) rather than real registrations/logins, so
 * running this doesn't pollute the DB with dozens of throwaway accounts -
 * the rate limiter runs ahead of the route handler either way, so it
 * still counts against the cap.
 *
 * Heads up: this burns a chunk of the 1-minute window for whichever
 * endpoint it hits, so running the full suite (all test:* scripts) back
 * to back may occasionally see a 429 on a LATER file's first request or
 * two if it lands inside the same 60s window this file just used up.
 * That's the rate limiter doing its job, not a bug - just re-run that
 * file a few seconds later if it happens.
 */

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api';
const BURST_SIZE = 30;

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    if (detail !== undefined) console.log(`    ${JSON.stringify(detail)}`);
    failed++;
  }
}

async function burst(path: string, body: unknown): Promise<number[]> {
  const requests = Array.from({ length: BURST_SIZE }, () =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => res.status)
  );
  return Promise.all(requests);
}

async function main() {
  console.log(`Running rate limit tests against ${BASE_URL}\n`);

  // --- /auth/register --------------------------------------------------
  // Missing `password`/`role`/`user_name` - always 400 if it gets past
  // the limiter, never actually creates a user.
  const registerStatuses = await burst('/auth/register', {
    email: `ratelimit_${Date.now()}@example.com`,
  });
  const register429s = registerStatuses.filter((s) => s === 429).length;
  const registerNon429s = registerStatuses.filter((s) => s !== 429);

  check(
    '01 First register request in the burst was not rate-limited',
    registerStatuses[0] === 400,
    { firstStatus: registerStatuses[0] }
  );
  check(
    `02 Register burst of ${BURST_SIZE} triggered 429s (cap is 20/min)`,
    register429s > 0,
    { statuses: registerStatuses }
  );
  check(
    '03 Every non-429 register response was the expected validation 400',
    registerNon429s.every((s) => s === 400),
    { registerNon429s }
  );

  // --- /auth/login -------------------------------------------------------
  // Bogus credentials - always 401 if it gets past the limiter, never
  // actually authenticates anything.
  const loginStatuses = await burst('/auth/login', {
    identifier: `nobody_${Date.now()}@example.com`,
    password: 'wrong-password',
  });
  const login429s = loginStatuses.filter((s) => s === 429).length;
  const loginNon429s = loginStatuses.filter((s) => s !== 429);

  check(
    '04 First login request in the burst was not rate-limited',
    loginStatuses[0] === 401,
    { firstStatus: loginStatuses[0] }
  );
  check(
    `05 Login burst of ${BURST_SIZE} triggered 429s (cap is 20/min)`,
    login429s > 0,
    { statuses: loginStatuses }
  );
  check(
    '06 Every non-429 login response was the expected auth 401',
    loginNon429s.every((s) => s === 401),
    { loginNon429s }
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  console.error('\nIs the server actually running? Try `npm run dev` from the repo root first.');
  process.exit(1);
});
