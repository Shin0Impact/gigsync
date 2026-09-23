/**
 * Basic API tests for /api/auth (board card #28).
 *
 * No paid tools, no VS Code extension, no account required - just Node's
 * built-in fetch. Run with the server already running locally, then:
 *
 *   npm run test:auth
 *
 * (from the server/ directory). Exits with a non-zero code if anything
 * fails, so it's CI-friendly later if you want to wire it into ci.yml.
 *
 * Covers registration (artist + organizer success, missing fields, artist
 * missing artists_type, duplicate email), login (success, missing fields,
 * wrong password), and the session lifecycle (/me before login, after
 * login, after token refresh, after logout, confirming unauthenticated
 * again). Nothing else under /api is implemented yet - everything else
 * (artists/events/media/conversations) still returns 501 stubs.
 */

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

// --- tiny manual cookie jar -------------------------------------------
// fetch() doesn't persist cookies across calls like a browser does, so we
// track Set-Cookie headers ourselves and replay them on later requests.
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
): Promise<{ status: number; body: unknown }> {
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

// --- tiny assertion helper ----------------------------------------------
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

async function main() {
  console.log(`Running auth API tests against ${BASE_URL}\n`);

  const stamp = Date.now();
  const email = `artist_${stamp}@example.com`;
  const username = `artist_${stamp}`;
  const password = 'TestPass123!';
  const orgEmail = `organizer_${stamp}@example.com`;
  const orgUsername = `organizer_${stamp}`;

  let r = await request('GET', '/auth/me');
  check('01 Me (unauthenticated)', r.status, 401, r.body);

  r = await request('POST', '/auth/register', {
    email,
    password,
    role: 'artist',
    user_name: username,
    artists_type: 'musician',
  });
  check('02 Register artist (success)', r.status, 201, r.body);

  r = await request('POST', '/auth/register', {
    email: orgEmail,
    password,
    role: 'organizer',
    user_name: orgUsername,
  });
  check('03 Register organizer (success)', r.status, 201, r.body);

  r = await request('POST', '/auth/register', { email: 'incomplete@example.com' });
  check('04 Register missing fields', r.status, 400, r.body);

  r = await request('POST', '/auth/register', {
    email: `noartisttype_${stamp}@example.com`,
    password,
    role: 'artist',
    user_name: `noartisttype_${stamp}`,
  });
  check('05 Register artist without artists_type', r.status, 400, r.body);

  r = await request('POST', '/auth/register', {
    email,
    password,
    role: 'artist',
    user_name: `dup_${stamp}`,
    artists_type: 'painter',
  });
  check('06 Register duplicate email', r.status, 409, r.body);

  // Security fix: registration must not let a caller self-assign a
  // privileged role. moderator/admin can view other users' verification
  // ID documents and approve/reject requests - those accounts must be
  // created out-of-band, never picked from the public signup form.
  const modEmail = `wouldbemod_${stamp}@example.com`;
  r = await request('POST', '/auth/register', {
    email: modEmail,
    password,
    role: 'moderator',
    user_name: `wouldbemod_${stamp}`,
  });
  check('06b Register as moderator is rejected', r.status, 400, r.body);

  r = await request('POST', '/auth/register', {
    email: `wouldbeadmin_${stamp}@example.com`,
    password,
    role: 'admin',
    user_name: `wouldbeadmin_${stamp}`,
  });
  check('06c Register as admin is rejected', r.status, 400, r.body);

  // Confirm the rejected moderator attempt didn't actually create an
  // account (the check must happen before any DB write, not just fail
  // the response while still leaving a row behind).
  r = await request('POST', '/auth/login', { identifier: modEmail, password });
  check('06d No account was created by the rejected moderator attempt', r.status, 401, r.body);

  r = await request('POST', '/auth/login', { identifier: email });
  check('07 Login missing fields', r.status, 400, r.body);

  r = await request('POST', '/auth/login', { identifier: email, password: 'wrong-password' });
  check('08 Login wrong password', r.status, 401, r.body);

  r = await request('POST', '/auth/login', { identifier: email, password });
  check('09 Login (success)', r.status, 200, r.body);

  r = await request('GET', '/auth/me');
  check('10 Me (authenticated)', r.status, 200, r.body);

  r = await request('POST', '/auth/refresh');
  check('11 Refresh tokens (success)', r.status, 200, r.body);

  r = await request('GET', '/auth/me');
  check('12 Me (after refresh)', r.status, 200, r.body);

  r = await request('POST', '/auth/logout');
  check('13 Logout', r.status, 204, r.body);

  r = await request('GET', '/auth/me');
  check('14 Me (after logout)', r.status, 401, r.body);

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
