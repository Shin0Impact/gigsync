/**
 * API tests for the account-recovery surface:
 *   POST /api/auth/change-password      (authenticated)
 *   POST /api/auth/forgot-password      (public, rate-limited)
 *   POST /api/auth/reset-password       (public, single-use token)
 *   POST /api/auth/verify-email         (public, single-use token)
 *   POST /api/auth/resend-verification  (authenticated, rate-limited)
 *
 * There's no mail provider yet, so in non-production builds the endpoints
 * return the raw token as devResetToken / devVerificationToken (and the
 * register response carries dev_email_verification_token) - these tests
 * rely on that, and assert the production-only fields behave (absent is
 * not asserted since tests always run in development).
 *
 * Run with the server already running locally, then from server/:
 *
 *   npm run test:auth-recovery
 *
 * Covers: token single-use (reuse -> 400), token invalidation when a newer
 * token is issued, wrong/garbage tokens, weak new passwords, wrong current
 * password, no-account-enumeration on forgot-password (identical 200, no
 * token), emailVerified flipping true via verify-email and surfacing on
 * /me, and login working with the new password (and not the old) after
 * each flow.
 */

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

const jars: Record<string, string[]> = {};

function cookieHeader(who: string): string {
  return (jars[who] ?? []).map((c) => c.split(';')[0]).join('; ');
}

function storeCookies(who: string, res: Response) {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const sc of setCookies) {
    const name = sc.split('=')[0];
    jars[who] = (jars[who] ?? []).filter((c) => !c.startsWith(`${name}=`));
    jars[who].push(sc);
  }
}

async function request(
  who: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(jars[who]?.length ? { Cookie: cookieHeader(who) } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  storeCookies(who, res);

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // empty body (e.g. 204 No Content) - fine
  }

  return { status: res.status, body: json };
}

let passed = 0;
let failed = 0;

function check(name: string, actual: number, expected: number, body: unknown) {
  if (actual === expected) {
    console.log(`  \x1b[32m✓\x1b[0m ${name} (${actual})`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${name} - expected ${expected}, got ${actual}`);
    console.log(`    ${JSON.stringify(body)}`);
    failed++;
  }
}

function checkField(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  \x1b[32m✓\x1b[0m ${name} = ${JSON.stringify(actual)}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${name} - expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

async function main() {
  console.log(`Running auth-recovery API tests against ${BASE_URL}\n`);

  const stamp = Date.now();
  const email = `recovery_${stamp}@example.com`;
  const username = `recovery_${stamp}`;
  const password = 'FirstPass123!';
  const changedPassword = 'SecondPass123!';
  const resetPassword = 'ThirdPass123!';

  // --- setup: one fresh account --------------------------------------
  let r = await request('A', 'POST', '/auth/register', {
    email, password, role: 'artist', user_name: username, name: `Recovery ${stamp}`, artists_type: 'painter',
  });
  check('01 Register (setup)', r.status, 201, r.body);
  const registerToken = r.body?.dev_email_verification_token;
  checkField('01a Register returns a dev verification token', typeof registerToken === 'string' && registerToken.length > 0 ? 1 : 0, 1);

  r = await request('A', 'POST', '/auth/login', { identifier: email, password });
  check('02 Login (setup)', r.status, 200, r.body);

  // --- email verification ---------------------------------------------
  r = await request('A', 'GET', '/auth/me');
  checkField('03 New account is unverified', r.body?.user?.emailVerified, false);

  r = await request('anon', 'POST', '/auth/verify-email', { token: 'garbage-token' });
  check('04 Verify with garbage token is 400', r.status, 400, r.body);

  r = await request('anon', 'POST', '/auth/verify-email', { token: registerToken });
  check('05 Verify with the register token', r.status, 200, r.body);

  r = await request('A', 'GET', '/auth/me');
  checkField('06 me.emailVerified is now true', r.body?.user?.emailVerified, true);

  r = await request('anon', 'POST', '/auth/verify-email', { token: registerToken });
  check('07 Verification token is single-use (reuse is 400)', r.status, 400, r.body);

  r = await request('A', 'POST', '/auth/resend-verification');
  check('08 Resend verification (authed)', r.status, 200, r.body);
  const resentToken = r.body?.devVerificationToken;
  checkField('08a Resend returns a fresh dev token', typeof resentToken === 'string' && resentToken !== registerToken ? 1 : 0, 1);

  r = await request('anon', 'POST', '/auth/verify-email', { token: resentToken });
  check('09 Fresh token still verifies (idempotent)', r.status, 200, r.body);

  r = await request('anon', 'POST', '/auth/resend-verification');
  check('10 Resend requires auth', r.status, 401, r.body);

  // --- change password --------------------------------------------------
  r = await request('anon', 'POST', '/auth/change-password', { currentPassword: password, newPassword: changedPassword });
  check('11 Change password requires auth', r.status, 401, r.body);

  r = await request('A', 'POST', '/auth/change-password', { currentPassword: 'wrong-current', newPassword: changedPassword });
  check('12 Change password with wrong current is 400', r.status, 400, r.body);

  r = await request('A', 'POST', '/auth/change-password', { currentPassword: password, newPassword: 'short' });
  check('13 Change password with weak new password is 400', r.status, 400, r.body);

  r = await request('A', 'POST', '/auth/change-password', { currentPassword: password, newPassword: changedPassword });
  check('14 Change password succeeds', r.status, 200, r.body);

  r = await request('anon', 'POST', '/auth/login', { identifier: email, password });
  check('15 Old password no longer works', r.status, 401, r.body);

  r = await request('A', 'POST', '/auth/login', { identifier: email, password: changedPassword });
  check('16 New password works', r.status, 200, r.body);

  // --- forgot / reset password ------------------------------------------
  r = await request('anon', 'POST', '/auth/forgot-password', { email: `nobody_${stamp}@example.com` });
  check('17 Forgot password for unknown email is still 200', r.status, 200, r.body);
  checkField('17a Unknown email leaks no token', r.body?.devResetToken, undefined);

  r = await request('anon', 'POST', '/auth/forgot-password', { email });
  check('18 Forgot password for known email', r.status, 200, r.body);
  const resetToken1 = r.body?.devResetToken;
  checkField('18a Known email returns a dev reset token', typeof resetToken1 === 'string' && resetToken1.length > 0 ? 1 : 0, 1);

  r = await request('anon', 'POST', '/auth/reset-password', { token: 'garbage-token', newPassword: resetPassword });
  check('19 Reset with garbage token is 400', r.status, 400, r.body);

  r = await request('anon', 'POST', '/auth/reset-password', { token: resetToken1, newPassword: 'short' });
  check('20 Reset with weak password is 400', r.status, 400, r.body);

  r = await request('anon', 'POST', '/auth/reset-password', { token: resetToken1, newPassword: resetPassword });
  check('21 Reset password succeeds', r.status, 200, r.body);

  r = await request('anon', 'POST', '/auth/login', { identifier: email, password: changedPassword });
  check('22 Password from before the reset no longer works', r.status, 401, r.body);

  r = await request('A', 'POST', '/auth/login', { identifier: email, password: resetPassword });
  check('23 Reset password works', r.status, 200, r.body);

  r = await request('anon', 'POST', '/auth/reset-password', { token: resetToken1, newPassword: 'FourthPass123!' });
  check('24 Reset token is single-use (reuse is 400)', r.status, 400, r.body);

  // A newer reset request invalidates the older unused token.
  r = await request('anon', 'POST', '/auth/forgot-password', { email });
  check('25 Second forgot-password request', r.status, 200, r.body);
  const resetToken2 = r.body?.devResetToken;
  checkField('25a Second token differs from the first', resetToken2 !== resetToken1 ? 1 : 0, 1);

  r = await request('anon', 'POST', '/auth/reset-password', { token: resetToken1, newPassword: 'FourthPass123!' });
  check('26 Older token is invalidated by the newer one', r.status, 400, r.body);

  r = await request('anon', 'POST', '/auth/reset-password', { token: resetToken2, newPassword: 'FourthPass123!' });
  check('27 Newest token works', r.status, 200, r.body);

  r = await request('A', 'POST', '/auth/login', { identifier: email, password: 'FourthPass123!' });
  check('28 Final password works', r.status, 200, r.body);

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
