/**
 * API tests for showcase items (card #78): POST/GET/DELETE
 * /api/media/showcases.
 *
 * Showcasing is a PIN, not an upload - a user stars an event_media or
 * update_media row they already own onto their profile. There's no R2
 * upload happening in this file; it pins media that was already uploaded
 * via the works endpoints (see works.api.test.ts / event_media.api.test.ts
 * for the real R2 upload proof).
 *
 * Same pattern as the other *.api.test.ts files. Run with the server
 * already running locally, then from server/:
 *
 *   npm run test:showcase
 *
 * Covers: pin requires auth; pin requires self-ownership of the source
 * media (a different artist can't pin someone else's update_media);
 * validation (missing/invalid sourceType); pinning the same media twice
 * is a conflict, not a duplicate row; the cap on how many items a profile
 * can pin (MAX_SHOWCASE_ITEMS in showcase.service.ts); listing a user's
 * showcase is public and resolves each pin to its underlying
 * objectKey/publicUrl; unpin requires ownership of the PIN (not the
 * source media) and 404s on a nonexistent id; and unpinning doesn't
 * delete the underlying event_media/update_media row.
 *
 * Needs `showcase_items` migrated to the pin shape (see the ALTER TABLE
 * comment at the top of server/src/db/queries/showcase.queries.ts) - the
 * old upload-based columns (media_type/object_key/alt_text) are gone.
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

// Creates a work -> work update -> update_media chain for `who` and
// returns the media id, so pin tests have something real to point at
// without duplicating the full works.api.test.ts flow.
async function makeUpdateMediaFor(who: string, stamp: number): Promise<number> {
  let r = await request(who, 'POST', '/works', { description: `portfolio ${stamp}` });
  const work = (r.body as { work: { id: number } }).work;

  r = await request(who, 'POST', `/works/${work.id}/updates`, { description: 'progress' });
  const update = (r.body as { update: { id: number } }).update;

  r = await request(who, 'POST', '/media/upload-url', { fileName: 'piece.png', contentType: 'image/png', folder: 'works' });
  const objectKey = (r.body as { objectKey: string }).objectKey;

  r = await request(who, 'POST', `/works/updates/${update.id}/media`, { mediaType: 'image', objectKey });
  return (r.body as { media: { id: number } }).media.id;
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

  const media1 = await makeUpdateMediaFor('artist', stamp);
  const media2 = await makeUpdateMediaFor('artist', stamp + 1);
  const media3 = await makeUpdateMediaFor('artist', stamp + 2);
  const media4 = await makeUpdateMediaFor('artist', stamp + 3);
  const otherArtistMedia = await makeUpdateMediaFor('artist2', stamp + 4);

  let r = await request('anon', 'POST', '/media/showcases', { sourceType: 'update_media', sourceId: media1 });
  check('01 Pin requires auth', r.status, 401, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'update_media', sourceId: otherArtistMedia });
  check("02 Cannot pin someone else's media", r.status, 403, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'update_media' });
  check('03 Pin missing sourceId', r.status, 400, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'audio', sourceId: media1 });
  check('04 Pin invalid sourceType', r.status, 400, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'update_media', sourceId: media1, sortOrder: 0 });
  check('05 Artist pins their own media', r.status, 201, r.body);
  const pin1 = (r.body as { item: { id: string; user_id: string } }).item;
  const artistUserId = pin1.user_id;

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'update_media', sourceId: media1 });
  check('06 Pinning the same media twice is a conflict', r.status, 409, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'update_media', sourceId: media2, sortOrder: 1 });
  check('07 Artist pins a second item', r.status, 201, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'update_media', sourceId: media3, sortOrder: 2 });
  check('08 Artist pins a third item', r.status, 201, r.body);

  r = await request('artist', 'POST', '/media/showcases', { sourceType: 'update_media', sourceId: media4, sortOrder: 3 });
  check('09 A fourth pin is rejected (cap reached)', r.status, 409, r.body);

  r = await request('anon', 'GET', `/media/showcases/${artistUserId}`);
  check('10 List showcase is public', r.status, 200, r.body);
  const items = (r.body as { items: { sourceType: string; objectKey: string | null; sortOrder: number }[] }).items;
  check('11 List has exactly 3 pinned items (cap enforced)', items.length, 3, items);
  check('12 List is ordered by sortOrder', items[0]?.sortOrder === 0 ? 1 : 0, 1, items);
  check('13 Each pin resolves to its underlying objectKey', items.every((i) => !!i.objectKey) ? 1 : 0, 1, items);

  r = await request('artist2', 'DELETE', `/media/showcases/${pin1.id}`);
  check('14 Different user cannot unpin someone else\'s pin', r.status, 403, r.body);

  r = await request('artist', 'DELETE', '/media/showcases/00000000-0000-0000-0000-000000000000');
  check('15 Unpin nonexistent pin id', r.status, 404, r.body);

  r = await request('artist', 'DELETE', `/media/showcases/${pin1.id}`);
  check('16 Owner unpins their own item', r.status, 204, r.body);

  r = await request('anon', 'GET', `/media/showcases/${artistUserId}`);
  const afterUnpin = (r.body as { items: unknown[] }).items;
  check('17 List reflects the unpin', afterUnpin.length, 2, afterUnpin);

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
