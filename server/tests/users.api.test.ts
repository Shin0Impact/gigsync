/**
 * API tests for GET /api/users/:identifier and the hydrated GET /api/auth/me.
 *
 * The profile-page contract:
 *   - :identifier accepts BOTH a user_name (mezzo.social/johndoe) and a
 *     user UUID, returning the same public profile shape either way.
 *   - The public shape carries role + artists_type (previously only
 *     available for the logged-in user via /me) but NEVER the email.
 *   - /me returns the same fields plus the caller's own email.
 *
 * Run with the server already running locally, then:
 *
 *   npm run test:users
 *
 * (from the server/ directory). Exits non-zero on failure.
 */

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

// --- tiny manual cookie jar (same pattern as auth.api.test.ts) -----------
let cookieJar: string[] = [];

function cookieHeader(): string {
  return cookieJar.map((c) => c.split(';')[0]).join('; ');
}

function storeCookies(res: Response) {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const sc of setCookies) {
    const name = sc.split('=')[0];
    cookieJar = cookieJar.filter((c) => !c.startsWith(`${name}=`));
    cookieJar.push(sc);
  }
}

async function request(
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieJar.length ? { Cookie: cookieHeader() } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  storeCookies(res);

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // empty body (e.g. 204 No Content) - fine
  }

  return { status: res.status, body: json };
}

// --- tiny assertion helpers ----------------------------------------------
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
  console.log(`Running users/profile API tests against ${BASE_URL}\n`);

  const stamp = Date.now();
  const email = `profileuser_${stamp}@example.com`;
  const username = `profileuser_${stamp}`;
  const password = 'TestPass123!';

  // --- setup: one registered artist -------------------------------
  let r = await request('POST', '/auth/register', {
    email,
    password,
    role: 'artist',
    user_name: username,
    name: 'Profile Test User',
    artists_type: 'designer',
  });
  check('01 Register artist (setup)', r.status, 201, r.body);
  const userId = r.body?.user?.id;

  // --- GET /api/users/:identifier ----------------------------------
  r = await request('GET', `/users/${username}`);
  check('02 Get user by user_name', r.status, 200, r.body);
  checkField('02a profile.userName', r.body?.profile?.userName, username);
  checkField('02b profile.userId', r.body?.profile?.userId, userId);
  checkField('02c profile.role', r.body?.profile?.role, 'artist');
  checkField('02d profile.artistsType', r.body?.profile?.artistsType, 'designer');
  checkField('02e profile.name', r.body?.profile?.name, 'Profile Test User');
  checkField('02f profile.email is NOT public', r.body?.profile?.email, undefined);

  r = await request('GET', `/users/${userId}`);
  check('03 Get user by userId', r.status, 200, r.body);
  checkField('03a profile.userName', r.body?.profile?.userName, username);
  checkField('03b profile.userId', r.body?.profile?.userId, userId);
  checkField('03c profile.role', r.body?.profile?.role, 'artist');
  checkField('03d profile.artistsType', r.body?.profile?.artistsType, 'designer');
  checkField('03e profile.name', r.body?.profile?.name, 'Profile Test User');

  r = await request('GET', `/users/no_such_user_${stamp}`);
  check('04 Unknown user_name is 404', r.status, 404, r.body);

  r = await request('GET', '/users/00000000-0000-0000-0000-000000000000');
  check('05 Unknown userId is 404', r.status, 404, r.body);

  // --- GET /api/auth/me (hydrated) ----------------------------------
  r = await request('GET', '/auth/me');
  check('06 Me (unauthenticated)', r.status, 401, r.body);

  r = await request('POST', '/auth/login', { identifier: email, password });
  check('07 Login (setup)', r.status, 200, r.body);

  r = await request('GET', '/auth/me');
  check('08 Me returns hydrated profile', r.status, 200, r.body);
  checkField('08a me.userId', r.body?.user?.userId, userId);
  checkField('08b me.email', r.body?.user?.email, email);
  checkField('08c me.userName', r.body?.user?.userName, username);
  checkField('08d me.role', r.body?.user?.role, 'artist');
  checkField('08e me.artistsType', r.body?.user?.artistsType, 'designer');
  checkField('08f me.name', r.body?.user?.name, 'Profile Test User');

  r = await request('POST', '/auth/logout');
  check('09 Logout (cleanup)', r.status, 204, r.body);

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
