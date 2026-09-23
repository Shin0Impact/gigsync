/**
 * API test for the login timing side-channel fix (security fix:
 * login_user in src/services/auth.service.ts used to return immediately
 * - skipping bcrypt.compare entirely - when the identifier didn't match
 * any user, but ran a real bcrypt.compare (cost factor 12, tens to
 * hundreds of ms) when it did. Both paths threw the same generic
 * "Invalid credentials" message, but the RESPONSE TIME gave away whether
 * an email/username was actually registered, which is enough to
 * enumerate real accounts via a timing attack even without ever seeing a
 * different error message).
 *
 * Run with the server already running locally, then from server/:
 *
 *   npm run test:login-timing
 *
 * Only 10 total login attempts (5 against a real user with the wrong
 * password, 5 against a made-up email) - comfortably under the 20/minute
 * login rate limit added alongside this fix, but ONLY if nothing else
 * hit /auth/login in the last minute. Don't run this right after
 * test:auth or test:rate-limit in the same 60s window - if you do, wait
 * ~60s and re-run; check 01 below will tell you clearly if that happened
 * rather than silently reporting bogus timing numbers.
 */

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api';
const SAMPLES_PER_GROUP = 5;

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

async function timedLogin(identifier: string, password: string): Promise<{ status: number; ms: number }> {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  await res.json().catch(() => null);
  return { status: res.status, ms: performance.now() - start };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function main() {
  console.log(`Running login timing tests against ${BASE_URL}\n`);

  const stamp = Date.now();
  const realEmail = `timing_${stamp}@example.com`;

  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: realEmail,
      password: 'Test1234!',
      role: 'artist',
      user_name: `timing_${stamp}`,
      artists_type: 'musician',
    }),
  });
  if (registerRes.status !== 201) {
    throw new Error(`Failed to register fixture user for timing test: ${registerRes.status}`);
  }

  // Sequential, not concurrent - a clean one-at-a-time timing signal per
  // request, and it naturally stays well under the rate limiter too.
  const existingUserSamples: { status: number; ms: number }[] = [];
  for (let i = 0; i < SAMPLES_PER_GROUP; i++) {
    existingUserSamples.push(await timedLogin(realEmail, 'definitely-the-wrong-password'));
  }

  const missingUserSamples: { status: number; ms: number }[] = [];
  for (let i = 0; i < SAMPLES_PER_GROUP; i++) {
    missingUserSamples.push(await timedLogin(`nobody_${stamp}_${i}@example.com`, 'whatever-password'));
  }

  const allSamples = [...existingUserSamples, ...missingUserSamples];
  const any429 = allSamples.some((s) => s.status === 429);

  check(
    '01 No requests were rate-limited during timing collection (re-run in ~60s if this fails)',
    !any429,
    allSamples.map((s) => s.status)
  );

  check(
    '02 Every wrong-password attempt against the real user returned 401',
    existingUserSamples.every((s) => s.status === 401),
    existingUserSamples.map((s) => s.status)
  );

  check(
    '03 Every attempt against a nonexistent email returned 401',
    missingUserSamples.every((s) => s.status === 401),
    missingUserSamples.map((s) => s.status)
  );

  const existingMedian = median(existingUserSamples.map((s) => s.ms));
  const missingMedian = median(missingUserSamples.map((s) => s.ms));
  const ratio = Math.min(existingMedian, missingMedian) / Math.max(existingMedian, missingMedian);

  // Before the fix, the missing-user path skipped bcrypt.compare
  // entirely and returned in a few ms, while the existing-user path ran
  // a real cost-12 bcrypt.compare (typically 100ms+) - a ratio nowhere
  // close to 1. 0.5 is a loose bound (allows for real network/DB
  // jitter) that still clearly fails on the old skip-bcrypt behavior.
  check(
    `04 Timing is comparable for existing vs nonexistent accounts (ratio ${ratio.toFixed(2)}, want > 0.5)`,
    ratio > 0.5,
    { existingUserMedianMs: existingMedian.toFixed(1), missingUserMedianMs: missingMedian.toFixed(1) }
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
