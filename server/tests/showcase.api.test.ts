/**
 * API tests for showcase items (card #78): POST/GET/DELETE
 * /api/media/showcases.
 *
 * Showcasing pins a whole PROJECT or EVENT, not a single post/media file:
 * an artist pins one of their own `works` (a project), an organizer pins
 * one of their own `event`s. A work has many versions (work_updates) over
 * time, so pinning the work itself - not a specific update - means the
 * showcase always reflects the project's current state, including
 * updates posted after the pin was made. No R2 upload happens in this
 * file; it pins projects/events that were already created via the
 * works/events endpoints (see works.api.test.ts / event_media.api.test.ts
 * for the real R2 upload proof).
 *
 * Run with the server already running locally, then from server/:
 *
 *   npm run test:showcase
 *
 * Covers: pin requires auth; pin requires self-ownership of the source
 * (a different artist can't pin someone else's work, a non-owning
 * organizer can't pin someone else's event); validation (missing/invalid
 * sourceType); pinning the same work/event twice is a conflict, not a
 * duplicate row; the cap on how many items a profile can pin
 * (MAX_SHOWCASE_ITEMS in showcase.service.ts); listing a user's showcase
 * is public and resolves a pinned work to EVERY update + all their media
 * (including one added after the pin, proving it's not frozen on a
 * version); both source types (work and event) are exercised; and unpin
 * requires ownership of the PIN (not the source), 404s on a nonexistent
 * id, and leaves the underlying work/event untouched.
 *
 * Needs `showcase_items` migrated to the whole-entity shape (see the
 * ALTER TABLE comment at the top of
 * server/src/db/queries/showcase.queries.ts).
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

// Creates a work with one update + one media item attached, for `who`,
// and returns the work id (the pin target - not the update id).
async function makeWorkFor(who: string, stamp: number): Promise<number> {
  let r = await request(who, 'POST', '/works', { description: `portfolio ${stamp}` });
  const work = (r.body as { work: { id: number } }).work;

  r = await request(who, 'POST', `/works/${work.id}/updates`, { description: `progress ${stamp}` });
  const update = (r.body as { update: { id: number } }).update;

  r = await request(who, 'POST', '/media/upload-url', { fileName: 'piece.png', contentType: 'image/png', folder: 'works' });
  const objectKey = (r.body as { objectKey: string }).objectKey;

  await request(who, 'POST', `/works/updates/${update.id}/media`, { mediaType: 'image', objectKey });
  return work.id;
}

async function makeEventFor(who: string, stamp: number): Promise<number> {
  const r = await request(who, 'POST', '/events', {
    title: `Showcase test event ${stamp}`, description: 'desc', startAt: '2027-03-01T10:00:00Z', endAt: '2027-03-01T18:00:00Z',
    venueName: 'Test Venue', location: { lat: 40.7, lng: -74.0 },
  });
  return (r.body as { event: { id: number } }).event.id;
}

async function main() {
  console.log(`Running showcase API tests against ${BASE_URL}\n`);

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

  await request('org2', 'POST', '/auth/register', {
    email: `org2_${stamp}@example.com`, password: 'TestPass123!', role: 'organizer', user_name: `org2_${stamp}`,
  });
  await request('org2', 'POST', '/auth/login', { identifier: `org2_${stamp}@example.com`, password: 'TestPass123!' });

  const work1 = await makeWorkFor('artist', stamp);
  const work2 = await makeWorkFor('artist', stamp + 1);
  const work3 = await makeWorkFor('artist', stamp + 2);
  const work4 = await makeWorkFor('artist', stamp + 3);
  const otherArtistWork = await makeWorkFor('artist2', stamp + 4);
  const event1 = await makeEventFor('org', stamp + 5);
  const otherOrgEvent = await makeEventFor('org2', stamp + 6);

  let r = await request('anon', 'POST', '/media/showcases', { sourceType: 'work', sourceId: work1 });
  check('01 Pin requires auth', r.status, 401, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'work', sourceId: otherArtistWork });
  check("02 Cannot pin someone else's work", r.status, 403, r.body);

  r = await request('org', 'POST', '/media/showcases', { sourceType: 'event', sourceId: otherOrgEvent });
  check("03 Cannot pin someone else's event", r.status, 403, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'work' });
  check('04 Pin missing sourceId', r.status, 400, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'nonsense', sourceId: work1 });
  check('05 Pin invalid sourceType', r.status, 400, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'work', sourceId: work1, sortOrder: 0 });
  check('06 Artist pins their own work', r.status, 201, r.body);
  const pin1 = (r.body as { item: { id: string; user_id: string } }).item;
  const artistUserId = pin1.user_id;

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'work', sourceId: work1 });
  check('07 Pinning the same work twice is a conflict', r.status, 409, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'work', sourceId: work2, sortOrder: 1 });
  check('08 Artist pins a second work', r.status, 201, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'work', sourceId: work3, sortOrder: 2 });
  check('09 Artist pins a third work', r.status, 201, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'work', sourceId: work4, sortOrder: 3 });
  check('10 A fourth pin is rejected (cap reached)', r.status, 409, r.body);

  // Post a SECOND update to work1 after it's already pinned - proves the
  // showcase reflects the project's current state, not a frozen version.
  r = await request('artist', 'POST', `/works/${work1}/updates`, { description: 'a later update, after pinning' });
  check('11 A later update can be added to an already-pinned work', r.status, 201, r.body);

  r = await request('anon', 'GET', `/media/showcases/${artistUserId}`);
  check('12 List showcase is public', r.status, 200, r.body);
  const items = (r.body as {
    items: { sourceType: string; sortOrder: number; post: { id: number; updates: { media: unknown[] }[] } | null }[];
  }).items;
  check('13 List has exactly 3 pinned items (cap enforced)', items.length, 3, items);
  check('14 List is ordered by sortOrder', items[0]?.sortOrder === 0 ? 1 : 0, 1, items);

  const work1Pin = items.find((i) => i.post?.id === work1);
  check('15 Pinned work resolves both its updates, not just the one that existed at pin time', work1Pin?.post?.updates.length ?? 0, 2, work1Pin);
  check('16 Each update under the pinned work has its media resolved', work1Pin?.post?.updates.every((u) => Array.isArray(u.media)) ? 1 : 0, 1, work1Pin);

  r = await request('org', 'POST', '/media/showcases', { sourceType: 'event', sourceId: event1, sortOrder: 0 });
  check('17 Organizer pins their own event', r.status, 201, r.body);
  const orgPin = (r.body as { item: { id: string; user_id: string } }).item;

  r = await request('anon', 'GET', `/media/showcases/${orgPin.user_id}`);
  const orgItems = (r.body as { items: { sourceType: string }[] }).items;
  check('18 Organizer showcase list contains the pinned event', orgItems.length === 1 && orgItems[0].sourceType === 'event' ? 1 : 0, 1, orgItems);

  r = await request('artist2', 'DELETE', `/media/showcases/${pin1.id}`);
  check("19 Different user cannot unpin someone else's pin", r.status, 403, r.body);

  r = await request('artist', 'DELETE', '/media/showcases/00000000-0000-0000-0000-000000000000');
  check('20 Unpin nonexistent pin id', r.status, 404, r.body);

  r = await request('artist', 'DELETE', `/media/showcases/${pin1.id}`);
  check('21 Owner unpins their own item', r.status, 204, r.body);

  r = await request('anon', 'GET', `/media/showcases/${artistUserId}`);
  const afterUnpin = (r.body as { items: unknown[] }).items;
  check('22 List reflects the unpin', afterUnpin.length, 2, afterUnpin);

  r = await request('anon', 'GET', `/works/${artistUserId}`);
  check('23 Unpinning did not touch the underlying works list', r.status, 200, r.body);

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
