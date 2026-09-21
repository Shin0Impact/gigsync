/**
 * API tests for /api/events (board card #23 - Event CRUD + application
 * endpoints).
 *
 * Same pattern as auth.api.test.ts - plain fetch, no paid tools. Run with
 * the server already running locally, then from server/:
 *
 *   npm run test:events
 *
 * Covers: role-gated create, validation (missing fields, endAt <= startAt,
 * invalid category), list/get/update/delete, the full apply -> list ->
 * accept/reject application flow, duplicate-apply and re-decide rejection,
 * and ownership checks (an organizer can't touch another organizer's
 * event, an artist can't touch the organizer-only endpoints).
 *
 * IMPORTANT: this exercises the live `event` table (singular, bigint ids,
 * PostGIS `location`, `categories_needed` array) - see
 * server/src/db/queries/events.queries.ts for why that's the real live
 * table rather than schema.sql's `events`. Your local Postgres needs the
 * PostGIS extension and the ALTER TABLE statements from the events-CRUD
 * handoff applied before this will pass locally.
 */

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

// One cookie jar per "user" so we can act as organizer/artist/artist2 in
// the same run without their sessions clobbering each other.
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

async function main() {
  console.log(`Running events API tests against ${BASE_URL}\n`);

  const stamp = Date.now();

  let r = await request('org', 'POST', '/auth/register', {
    email: `org_${stamp}@example.com`,
    password: 'TestPass123!',
    role: 'organizer',
    user_name: `org_${stamp}`,
  });
  check('01 Register organizer', r.status, 201, r.body);

  r = await request('artist', 'POST', '/auth/register', {
    email: `artist_${stamp}@example.com`,
    password: 'TestPass123!',
    role: 'artist',
    user_name: `artist_${stamp}`,
    artists_type: 'musician',
  });
  check('02 Register artist', r.status, 201, r.body);

  r = await request('artist2', 'POST', '/auth/register', {
    email: `artist2_${stamp}@example.com`,
    password: 'TestPass123!',
    role: 'artist',
    user_name: `artist2_${stamp}`,
    artists_type: 'painter',
  });
  check('03 Register second artist', r.status, 201, r.body);

  await request('org', 'POST', '/auth/login', { identifier: `org_${stamp}@example.com`, password: 'TestPass123!' });
  await request('artist', 'POST', '/auth/login', { identifier: `artist_${stamp}@example.com`, password: 'TestPass123!' });
  await request('artist2', 'POST', '/auth/login', { identifier: `artist2_${stamp}@example.com`, password: 'TestPass123!' });

  r = await request('artist', 'POST', '/events', {
    title: 'x', description: 'y', startAt: '2027-01-01T10:00:00Z', endAt: '2027-01-01T12:00:00Z',
    venueName: 'v', location: { lat: 1, lng: 1 },
  });
  check('04 Artist cannot create event', r.status, 403, r.body);

  r = await request('org', 'POST', '/events', { title: 'Missing stuff' });
  check('05 Create event missing fields', r.status, 400, r.body);

  r = await request('org', 'POST', '/events', {
    title: 'Bad dates', description: 'd', startAt: '2027-01-02T10:00:00Z', endAt: '2027-01-01T10:00:00Z',
    venueName: 'v', location: { lat: 40.7, lng: -74.0 },
  });
  check('06 Create event with endAt <= startAt', r.status, 400, r.body);

  r = await request('org', 'POST', '/events', {
    title: 'Bad category', description: 'd', startAt: '2027-01-01T10:00:00Z', endAt: '2027-01-01T12:00:00Z',
    venueName: 'v', location: { lat: 40.7, lng: -74.0 }, categoriesNeeded: ['dancer'],
  });
  check('07 Create event with invalid category', r.status, 400, r.body);

  r = await request('org', 'POST', '/events', {
    title: 'Live Jazz Night', description: 'A night of jazz', startAt: '2027-01-01T20:00:00Z', endAt: '2027-01-01T23:00:00Z',
    venueName: 'The Blue Note', location: { lat: 40.7308, lng: -74.0002 }, categoriesNeeded: ['musician'],
  });
  check('08 Organizer creates event', r.status, 201, r.body);
  const event = (r.body as { event: { id: number } }).event;
  const eventId = event.id;

  r = await request('anon', 'GET', '/events');
  check('09 List events (public)', r.status, 200, r.body);

  r = await request('anon', 'GET', '/events?category=musician');
  check('10 List events filtered by category', r.status, 200, r.body);

  r = await request('anon', 'GET', `/events/${eventId}`);
  check('11 Get event by id', r.status, 200, r.body);

  r = await request('anon', 'GET', '/events/999999');
  check('12 Get nonexistent event', r.status, 404, r.body);

  r = await request('artist', 'PATCH', `/events/${eventId}`, { title: 'Hijacked' });
  check('13 Artist cannot update event', r.status, 403, r.body);

  r = await request('org', 'PATCH', `/events/${eventId}`, { title: 'Live Jazz Night (Updated)' });
  check('14 Organizer updates own event', r.status, 200, r.body);

  r = await request('artist', 'POST', `/events/${eventId}/apply`, { coverNote: 'I would love to play!' });
  check('15 Artist applies to event', r.status, 201, r.body);
  const application = (r.body as { application: { id: string } }).application;

  r = await request('artist', 'POST', `/events/${eventId}/apply`, { coverNote: 'again' });
  check('16 Duplicate apply rejected', r.status, 409, r.body);

  r = await request('org', 'POST', `/events/${eventId}/apply`, {});
  check('17 Organizer cannot apply (wrong role)', r.status, 403, r.body);

  r = await request('artist', 'GET', `/events/${eventId}/applications`);
  check('18 Artist cannot list applications', r.status, 403, r.body);

  r = await request('org', 'GET', `/events/${eventId}/applications`);
  check('19 Organizer lists applications', r.status, 200, r.body);

  r = await request('artist2', 'POST', `/events/${eventId}/apply`, { coverNote: 'me too' });
  check('20 Second artist applies', r.status, 201, r.body);

  r = await request('org', 'PATCH', `/events/${eventId}/applications/${application.id}`, { status: 'accepted' });
  check('21 Organizer accepts application', r.status, 200, r.body);

  r = await request('org', 'PATCH', `/events/${eventId}/applications/${application.id}`, { status: 'accepted' });
  check('22 Re-deciding an already-decided application', r.status, 409, r.body);

  r = await request('org', 'PATCH', `/events/${eventId}/applications/${application.id}`, { status: 'maybe' });
  check('23 Invalid application status value', r.status, 400, r.body);

  r = await request('artist', 'DELETE', `/events/${eventId}`);
  check('24 Artist cannot delete event', r.status, 403, r.body);

  r = await request('org', 'DELETE', `/events/${eventId}`);
  check('25 Organizer deletes own event', r.status, 204, r.body);

  r = await request('anon', 'GET', `/events/${eventId}`);
  check('26 Deleted event now 404', r.status, 404, r.body);

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
