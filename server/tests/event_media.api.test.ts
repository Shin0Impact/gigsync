/**
 * API tests for event media: POST /api/media/upload-url and
 * /api/events/:id/media (create/list/delete).
 *
 * Same pattern as auth.api.test.ts / events.api.test.ts. Run with the
 * server already running locally, then from server/:
 *
 *   npm run test:event-media
 *
 * Covers: upload-url auth + validation (missing fields, unsupported
 * content type) and that it returns a real pre-signed R2 PUT URL and a
 * sanitized objectKey under the requested folder; event-media add/list/
 * delete with ownership checks (only the owning organizer can add/delete,
 * an artist can't touch either write endpoint, listing is public);
 * validation (missing fields, invalid mediaType); and sort_order ordering
 * on list.
 *
 * NOTE: generating a pre-signed URL is a local HMAC computation - the AWS
 * SDK never makes a network call to do it - so this passes even with
 * placeholder R2 credentials in .env. It does NOT prove an actual PUT to
 * that URL succeeds against a real R2 bucket; that still needs manual
 * verification once real R2_* credentials are in place.
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
  console.log(`Running event media API tests against ${BASE_URL}\n`);

  const stamp = Date.now();

  await request('org', 'POST', '/auth/register', {
    email: `org_${stamp}@example.com`, password: 'TestPass123!', role: 'organizer', user_name: `org_${stamp}`,
  });
  await request('org', 'POST', '/auth/login', { identifier: `org_${stamp}@example.com`, password: 'TestPass123!' });

  await request('org2', 'POST', '/auth/register', {
    email: `org2_${stamp}@example.com`, password: 'TestPass123!', role: 'organizer', user_name: `org2_${stamp}`,
  });
  await request('org2', 'POST', '/auth/login', { identifier: `org2_${stamp}@example.com`, password: 'TestPass123!' });

  await request('artist', 'POST', '/auth/register', {
    email: `artist_${stamp}@example.com`, password: 'TestPass123!', role: 'artist', user_name: `artist_${stamp}`, artists_type: 'musician',
  });
  await request('artist', 'POST', '/auth/login', { identifier: `artist_${stamp}@example.com`, password: 'TestPass123!' });

  let r = await request('anon', 'POST', '/media/upload-url', { fileName: 'flyer.png', contentType: 'image/png' });
  check('01 upload-url requires auth', r.status, 401, r.body);

  r = await request('org', 'POST', '/media/upload-url', { fileName: 'flyer.png' });
  check('02 upload-url missing contentType', r.status, 400, r.body);

  r = await request('org', 'POST', '/media/upload-url', { fileName: 'virus.exe', contentType: 'application/x-msdownload' });
  check('03 upload-url unsupported contentType', r.status, 400, r.body);

  r = await request('org', 'POST', '/media/upload-url', { fileName: 'flyer poster.png', contentType: 'image/png', folder: 'events' });
  check('04 upload-url success', r.status, 200, r.body);
  const uploadResult = r.body as { uploadUrl: string; objectKey: string; publicUrl: string | null };
  check('05 uploadUrl is a real pre-signed R2 PUT URL', uploadResult.uploadUrl?.includes('X-Amz-Signature') ? 1 : 0, 1, uploadResult.uploadUrl);
  check('06 objectKey lands under the requested folder', uploadResult.objectKey?.startsWith('events/') ? 1 : 0, 1, uploadResult.objectKey);
  check('07 objectKey sanitizes unsafe filename characters', uploadResult.objectKey?.includes(' ') ? 0 : 1, 1, uploadResult.objectKey);
  const objectKey = uploadResult.objectKey;

  // --- Real R2 round-trip, not just signature shape -----------------------
  // Everything above only proves the SIGNATURE is well-formed - presigning
  // is a local HMAC computation, so it "passes" even against placeholder
  // R2_* env vars with no real bucket behind them. These checks are the
  // ones that actually prove R2 is wired up: we PUT real bytes to the
  // presigned URL, then read them back via the public URL. They're skipped
  // (not failed) when R2_PUBLIC_URL isn't set, so this file still runs
  // clean for teammates who haven't configured a real bucket yet.
  if (uploadResult.publicUrl) {
    const fileBytes = Buffer.from(
      // 1x1 transparent PNG, so the content-type actually matches real image bytes
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    );

    const putRes = await fetch(uploadResult.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: fileBytes,
    });
    check('07b PUT to presigned URL is accepted by R2', putRes.status, 200, await putRes.text().catch(() => ''));

    // R2 is eventually-consistent-ish on very fresh writes in rare cases;
    // give it a beat before reading back.
    await new Promise((resolve) => setTimeout(resolve, 500));

    const getRes = await fetch(uploadResult.publicUrl);
    // IMPORTANT: a fetch Response body can only be read once. Read it a
    // single time as bytes here, then reuse those same bytes for both the
    // status check's log line and the byte-comparison below - calling
    // .text() and then .arrayBuffer() on the same Response drains the
    // stream on the first call and silently makes the second read empty.
    const roundTrippedBytes = Buffer.from(await getRes.arrayBuffer().catch(() => new ArrayBuffer(0)));
    check('07c Uploaded object is readable back from the public URL', getRes.status, 200, roundTrippedBytes.toString('base64').slice(0, 80));

    check(
      '07d Round-tripped bytes match what was uploaded',
      roundTrippedBytes.equals(fileBytes) ? 1 : 0,
      1,
      `uploaded ${fileBytes.length} bytes, got back ${roundTrippedBytes.length} bytes`
    );
  } else {
    console.log('  \x1b[33m\u26a0\x1b[0m 07b-07d skipped - R2_PUBLIC_URL not set, cannot verify a real round trip');
  }

  r = await request('org', 'POST', '/events', {
    title: 'Art Fair', description: 'desc', startAt: '2027-02-01T10:00:00Z', endAt: '2027-02-01T18:00:00Z',
    venueName: 'Warehouse 9', location: { lat: 40.7, lng: -74.0 },
  });
  const eventId = (r.body as { event: { id: number } }).event.id;

  r = await request('artist', 'POST', `/events/${eventId}/media`, { mediaType: 'image', objectKey });
  check('08 Artist cannot add event media', r.status, 403, r.body);

  r = await request('org2', 'POST', `/events/${eventId}/media`, { mediaType: 'image', objectKey });
  check('09 Non-owning organizer cannot add event media', r.status, 403, r.body);

  r = await request('org', 'POST', `/events/${eventId}/media`, { mediaType: 'image' });
  check('10 Add media missing objectKey', r.status, 400, r.body);

  r = await request('org', 'POST', `/events/${eventId}/media`, { mediaType: 'pdf', objectKey });
  check('11 Add media invalid mediaType', r.status, 400, r.body);

  r = await request('org', 'POST', `/events/${eventId}/media`, { mediaType: 'image', objectKey, altText: 'Event flyer', sortOrder: 0 });
  check('12 Organizer adds event media', r.status, 201, r.body);
  const media1 = (r.body as { media: { id: string } }).media;

  r = await request('org', 'POST', `/events/${eventId}/media`, { mediaType: 'image', objectKey: `${objectKey}-2`, sortOrder: 1 });
  check('13 Organizer adds second media item', r.status, 201, r.body);

  r = await request('anon', 'GET', `/events/${eventId}/media`);
  check('14 List event media is public', r.status, 200, r.body);
  const mediaList = (r.body as { media: { sort_order: number }[] }).media;
  check('15 Media list is ordered by sort_order', mediaList.length === 2 && mediaList[0].sort_order === 0 ? 1 : 0, 1, mediaList);

  r = await request('anon', 'GET', '/events/999999/media');
  check('16 List media for nonexistent event', r.status, 404, r.body);

  r = await request('artist', 'DELETE', `/events/${eventId}/media/${media1.id}`);
  check('17 Artist cannot delete event media', r.status, 403, r.body);

  r = await request('org', 'DELETE', `/events/${eventId}/media/00000000-0000-0000-0000-000000000000`);
  check('18 Delete nonexistent media id', r.status, 404, r.body);

  r = await request('org', 'DELETE', `/events/${eventId}/media/${media1.id}`);
  check('19 Organizer deletes own event media', r.status, 204, r.body);

  // media1 was created with `objectKey` (the same key checks 07b-07d PUT
  // real bytes to), so deleting it is also our chance to prove the R2
  // object itself actually gets cleaned up, not just the DB row - skipped
  // when there's no real bucket to check against, same as 07b-07d.
  if (uploadResult.publicUrl) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const afterDeleteRes = await fetch(uploadResult.publicUrl);
    check('19b Deleting event media also deletes the R2 object', afterDeleteRes.status === 404 ? 1 : 0, 1, `got status ${afterDeleteRes.status}`);
  } else {
    console.log('  \x1b[33m\u26a0\x1b[0m 19b skipped - R2_PUBLIC_URL not set, cannot verify R2 cleanup');
  }

  r = await request('anon', 'GET', `/events/${eventId}/media`);
  const afterDelete = (r.body as { media: unknown[] }).media;
  check('20 Media list reflects the delete', afterDelete.length === 1 ? 1 : 0, 1, afterDelete);

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
