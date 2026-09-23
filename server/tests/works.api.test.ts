/**
 * API tests for the works portfolio feature (card #78 follow-up):
 * POST/GET /api/works, /api/works/:workId/updates, and
 * /api/works/updates/:updateId/media.
 *
 * Same pattern as event_media.api.test.ts / showcase.api.test.ts. Run with
 * the server already running locally, then from server/:
 *
 *   npm run test:works
 *
 * Covers: create work requires auth + the artist role; add update requires
 * ownership of the work (a different artist gets 403); add media requires
 * ownership too, walking update -> work -> userId; validation (missing
 * objectKey, invalid mediaType); listing works/updates/media is public;
 * delete media requires ownership, 404s on a nonexistent id; and, when
 * R2_PUBLIC_URL is configured, a real PUT-to-presigned-URL / GET-back /
 * byte-compare round trip plus proof that deleting media also deletes the
 * R2 object - same real-R2 pattern as the other two media test files.
 *
 * This only tests the "artist uploads" slice (works/work_updates/
 * update_media). Likes/comments/follows have no write path yet and aren't
 * covered here.
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

async function main() {
  console.log(`Running works API tests against ${BASE_URL}\n`);

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

  let r = await request('anon', 'POST', '/works', { description: 'A mural project' });
  check('01 Create work requires auth', r.status, 401, r.body);

  r = await request('org', 'POST', '/works', { description: 'A mural project' });
  check('02 Organizer cannot create a work', r.status, 403, r.body);

  r = await request('artist', 'POST', '/works', { description: 'A mural project' });
  check('03 Artist creates a work', r.status, 201, r.body);
  const work = (r.body as { work: { id: number; userId: string } }).work;

  r = await request('anon', 'GET', `/works/${work.userId}`);
  check('04 List works is public', r.status, 200, r.body);
  const works = (r.body as { works: unknown[] }).works;
  check('05 Listed works includes the new one', works.length >= 1 ? 1 : 0, 1, works);

  r = await request('artist2', 'POST', `/works/${work.id}/updates`, { description: 'Day 1 progress' });
  check('06 Different artist cannot add an update to this work', r.status, 403, r.body);

  r = await request('artist', 'POST', `/works/${work.id}/updates`, { description: 'Day 1 progress' });
  check('07 Owner adds a work update', r.status, 201, r.body);
  const update = (r.body as { update: { id: number; versionNumber: number } }).update;
  check('08 First update is version 1', update.versionNumber, 1, update);

  r = await request('artist', 'POST', `/works/${work.id}/updates`, { description: 'Day 2 progress' });
  check('09 Second update is version 2', (r.body as { update: { versionNumber: number } }).update.versionNumber, 2, r.body);

  r = await request('anon', 'GET', `/works/${work.id}/updates`);
  check('10 List work updates is public', r.status, 200, r.body);

  // Security fix: fileSizeBytes is now required on upload-url requests
  // (previously nothing capped how large a file the presigned URL would
  // accept) - 68 matches the 1x1 PNG decoded below for the real R2
  // round-trip, and is also what's already passed as fileSizeBytes to the
  // add-media endpoint further down (check 15).
  r = await request('artist', 'POST', '/media/upload-url', {
    fileName: 'progress shot.png', contentType: 'image/png', fileSizeBytes: 68, folder: 'works',
  });
  check('11 upload-url success', r.status, 200, r.body);
  const uploadResult = r.body as { uploadUrl: string; objectKey: string; publicUrl: string | null };
  const objectKey = uploadResult.objectKey;

  r = await request('artist2', 'POST', `/works/updates/${update.id}/media`, { mediaType: 'image', objectKey });
  check('12 Different artist cannot add media to this update', r.status, 403, r.body);

  r = await request('artist', 'POST', `/works/updates/${update.id}/media`, { mediaType: 'image' });
  check('13 Add update media missing objectKey', r.status, 400, r.body);

  r = await request('artist', 'POST', `/works/updates/${update.id}/media`, { mediaType: 'pdf', objectKey });
  check('14 Add update media invalid mediaType', r.status, 400, r.body);

  r = await request('artist', 'POST', `/works/updates/${update.id}/media`, {
    mediaType: 'image', objectKey, mimeType: 'image/png', fileSizeBytes: 68, sortOrder: 0,
  });
  check('15 Owner adds update media', r.status, 201, r.body);
  const media1 = (r.body as { media: { id: number } }).media;

  // --- Real R2 round-trip, not just signature shape -----------------------
  if (uploadResult.publicUrl) {
    const fileBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    );

    const putRes = await fetch(uploadResult.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: fileBytes,
    });
    check('15b PUT to presigned URL is accepted by R2', putRes.status, 200, await putRes.text().catch(() => ''));

    await new Promise((resolve) => setTimeout(resolve, 500));

    const getRes = await fetch(uploadResult.publicUrl);
    const roundTrippedBytes = Buffer.from(await getRes.arrayBuffer().catch(() => new ArrayBuffer(0)));
    check('15c Uploaded object is readable back from the public URL', getRes.status, 200, roundTrippedBytes.toString('base64').slice(0, 80));
    check(
      '15d Round-tripped bytes match what was uploaded',
      roundTrippedBytes.equals(fileBytes) ? 1 : 0,
      1,
      `uploaded ${fileBytes.length} bytes, got back ${roundTrippedBytes.length} bytes`
    );
  } else {
    console.log('  \x1b[33m⚠\x1b[0m 15b-15d skipped - R2_PUBLIC_URL not set, cannot verify a real round trip');
  }

  r = await request('anon', 'GET', `/works/updates/${update.id}/media`);
  check('16 List update media is public', r.status, 200, r.body);

  r = await request('artist2', 'DELETE', `/works/updates/${update.id}/media/${media1.id}`);
  check('17 Different artist cannot delete this media', r.status, 403, r.body);

  r = await request('artist', 'DELETE', `/works/updates/${update.id}/media/999999999`);
  check('18 Delete nonexistent media id', r.status, 404, r.body);

  r = await request('artist', 'DELETE', `/works/updates/${update.id}/media/${media1.id}`);
  check('19 Owner deletes own update media', r.status, 204, r.body);

  if (uploadResult.publicUrl) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const afterDeleteRes = await fetch(uploadResult.publicUrl);
    check('19b Deleting update media also deletes the R2 object', afterDeleteRes.status === 404 ? 1 : 0, 1, `got status ${afterDeleteRes.status}`);
  } else {
    console.log('  \x1b[33m⚠\x1b[0m 19b skipped - R2_PUBLIC_URL not set, cannot verify R2 cleanup');
  }

  r = await request('anon', 'GET', `/works/updates/${update.id}/media`);
  const afterDelete = (r.body as { media: unknown[] }).media;
  check('20 Update media list reflects the delete', afterDelete.length === 0 ? 1 : 0, 1, afterDelete);

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
