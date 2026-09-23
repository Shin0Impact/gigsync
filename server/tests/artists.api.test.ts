/**
 * API tests for emergency availability (card #25):
 * PATCH /api/artists/me/emergency-status, GET /api/artists/:userId/emergency-status,
 * and GET /api/artists/emergency-available.
 *
 * Run with the server already running locally, then from server/:
 *
 *   npm run test:artists
 *
 * Covers: toggling requires auth + the artist role; turning availability on
 * requires lat/lng (turning it off doesn't); a past emergencyUntil is
 * rejected; out-of-range lat/lng/radius_km are rejected (including a
 * missing/non-numeric query param, which becomes NaN rather than throwing
 * a normal type error - see the Number.isFinite checks in
 * artists.service.ts); an available artist inside the search radius is
 * found, one ~130km away is not; a wider radius (still under the 200km
 * cap) finds both; turning availability back off removes them from search
 * results; and the public status endpoint reflects the current state for
 * any single artist - including that the artist's coordinates are only
 * exposed while they're actually available, not forever once they turn it
 * off (their last-known location isn't left publicly queryable).
 *
 * Does NOT assert on the Socket.IO `emergency_status_changed` broadcast -
 * there's no socket.io-client dev dependency in this repo yet to drive
 * that from a plain fetch-based test. Verify it manually: connect a socket
 * client, PATCH the status, confirm the event arrives.
 *
 * Needs three new columns on the live `profiles` table - see the migration
 * SQL at the top of server/src/services/artists.service.ts.
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
): Promise<{ status: number; body: unknown }> {
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
    // empty body - fine
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

async function main() {
  console.log(`Running artists (emergency availability) API tests against ${BASE_URL}\n`);

  const stamp = Date.now();

  await request('artist', 'POST', '/auth/register', {
    email: `artist_${stamp}@example.com`, password: 'TestPass123!', role: 'artist', user_name: `artist_${stamp}`, artists_type: 'musician',
  });
  await request('artist', 'POST', '/auth/login', { identifier: `artist_${stamp}@example.com`, password: 'TestPass123!' });

  await request('artist2', 'POST', '/auth/register', {
    email: `artist2_${stamp}@example.com`, password: 'TestPass123!', role: 'artist', user_name: `artist2_${stamp}`, artists_type: 'painter',
  });
  await request('artist2', 'POST', '/auth/login', { identifier: `artist2_${stamp}@example.com`, password: 'TestPass123!' });

  await request('org', 'POST', '/auth/register', {
    email: `org_${stamp}@example.com`, password: 'TestPass123!', role: 'organizer', user_name: `org_${stamp}`,
  });
  await request('org', 'POST', '/auth/login', { identifier: `org_${stamp}@example.com`, password: 'TestPass123!' });

  // New York City - used as the artist's/search origin for the "inside
  // radius" checks.
  const NYC = { lat: 40.7128, lng: -74.006 };
  // Philadelphia - ~130km from NYC (haversine-verified), used to prove the
  // radius filter excludes a nearby-but-outside-radius artist without
  // exceeding MAX_RADIUS_KM (200) in artists.service.ts - LA (~3,900km)
  // would make the "wide radius finds both" case impossible to write
  // without either radius exceeding the cap or the cap being pointless.
  const PHL = { lat: 39.9526, lng: -75.1652 };

  // --- Toggle requires auth + role ---------------------------------------
  let r = await request('anon', 'PATCH', '/artists/me/emergency-status', { isEmergencyAvailable: true, ...NYC });
  check('01 Toggling requires auth', r.status, 401, r.body);

  r = await request('org', 'PATCH', '/artists/me/emergency-status', { isEmergencyAvailable: true, ...NYC });
  check('02 Non-artist cannot toggle emergency status', r.status, 403, r.body);

  // --- Validation ----------------------------------------------------------
  r = await request('artist', 'PATCH', '/artists/me/emergency-status', {});
  check('03 Missing isEmergencyAvailable -> rejected', r.status, 400, r.body);

  r = await request('artist', 'PATCH', '/artists/me/emergency-status', { isEmergencyAvailable: true });
  check('04 Turning on without lat/lng -> rejected', r.status, 400, r.body);

  r = await request('artist', 'PATCH', '/artists/me/emergency-status', { isEmergencyAvailable: true, lat: 200, lng: NYC.lng });
  check('05 Out-of-range lat -> rejected', r.status, 400, r.body);

  r = await request('artist', 'PATCH', '/artists/me/emergency-status', {
    isEmergencyAvailable: true,
    ...NYC,
    emergencyUntil: new Date(Date.now() - 60_000).toISOString(),
  });
  check('06 emergencyUntil in the past -> rejected', r.status, 400, r.body);

  // --- Turn artist 1 on near NYC -------------------------------------------
  r = await request('artist', 'PATCH', '/artists/me/emergency-status', { isEmergencyAvailable: true, ...NYC });
  check('07 Artist turns emergency availability on', r.status, 200, r.body);
  const artist1Status = (r.body as { status: { userId: string; isEmergencyAvailable: boolean } }).status;
  check('08 Response reflects availability on', artist1Status.isEmergencyAvailable ? 1 : 0, 1, artist1Status);
  const artist1Id = artist1Status.userId;

  // --- Turn artist 2 on near Philadelphia (~130km away) ---------------------
  r = await request('artist2', 'PATCH', '/artists/me/emergency-status', { isEmergencyAvailable: true, ...PHL });
  check('09 Second artist turns emergency availability on (~130km away)', r.status, 200, r.body);
  const artist2Id = (r.body as { status: { userId: string } }).status.userId;

  // --- Public status read ---------------------------------------------------
  r = await request('anon', 'GET', `/artists/${artist1Id}/emergency-status`);
  const statusRead = r.body as { status: { isEmergencyAvailable: boolean; location: unknown } };
  check('10 Public status read reflects availability', statusRead.status?.isEmergencyAvailable ? 1 : 0, 1, statusRead);
  check('10b Public status read exposes location while available', statusRead.status?.location !== null ? 1 : 0, 1, statusRead);

  // --- Search validation -----------------------------------------------------
  r = await request('anon', 'GET', '/artists/emergency-available');
  check('11 Search without lat/lng/radius_km -> rejected', r.status, 400, r.body);

  r = await request('anon', 'GET', `/artists/emergency-available?lat=${NYC.lat}&lng=${NYC.lng}&radius_km=999999`);
  check('12 radius_km above the cap -> rejected', r.status, 400, r.body);

  // --- Search finds the near artist, excludes the far-enough one ------------
  // This DB is shared/persistent across test runs (real Supabase, not a
  // throwaway reset-per-run DB), so other emergency-available artists from
  // earlier runs may legitimately be in the results too - these checks
  // filter down to just the two artists this run created rather than
  // asserting on the raw result count, same defensive pattern as
  // verification.api.test.ts's moderator-queue check.
  // radius_km=50 is well short of the ~130km NYC-Philadelphia gap.
  r = await request('anon', 'GET', `/artists/emergency-available?lat=${NYC.lat}&lng=${NYC.lng}&radius_km=50`);
  check('13 Search near NYC succeeds', r.status, 200, r.body);
  let results = (r.body as { artists: { userId: string }[] }).artists;
  check('14 Search finds artist 1 (near)', results.some((a) => a.userId === artist1Id) ? 1 : 0, 1, results);
  check('15 Search does not include artist 2 (~130km away, out of radius)', results.some((a) => a.userId === artist2Id) ? 1 : 0, 0, results);

  // --- A wider radius (still under the 200km cap) finds both ----------------
  r = await request('anon', 'GET', `/artists/emergency-available?lat=${NYC.lat}&lng=${NYC.lng}&radius_km=150`);
  results = (r.body as { artists: { userId: string }[] }).artists;
  check(
    '16 A 150km radius finds both artists',
    results.filter((a) => a.userId === artist1Id || a.userId === artist2Id).length,
    2,
    results,
  );

  // --- Turning it back off removes artist 1 from search ----------------------
  r = await request('artist', 'PATCH', '/artists/me/emergency-status', { isEmergencyAvailable: false });
  check('17 Artist turns emergency availability off (no lat/lng needed)', r.status, 200, r.body);

  r = await request('anon', 'GET', `/artists/emergency-available?lat=${NYC.lat}&lng=${NYC.lng}&radius_km=50`);
  results = (r.body as { artists: { userId: string }[] }).artists;
  check('18 Artist 1 no longer appears in search after turning off', results.some((a) => a.userId === artist1Id) ? 1 : 0, 0, results);

  r = await request('anon', 'GET', `/artists/${artist1Id}/emergency-status`);
  const statusAfterOff = (r.body as { status: { isEmergencyAvailable: boolean; location: unknown } }).status;
  check('19 Public status read reflects availability off', statusAfterOff.isEmergencyAvailable ? 1 : 0, 0, statusAfterOff);
  check('19b Location is hidden once no longer available', statusAfterOff.location === null ? 1 : 0, 1, statusAfterOff);

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
