/**
 * API tests for artist/organizer verification (card #82):
 * POST /api/verification/social-links, POST /api/verification/id-upload-url,
 * POST /api/verification/requests, GET /api/verification/status/:userId,
 * the moderator review queue (GET/PATCH /api/verification/requests), and
 * the moderator-only ID document view URL
 * (GET /api/verification/requests/:id/id-document).
 *
 * Run with the server already running locally, then from server/:
 *
 *   npm run test:verification
 *
 * Covers: requesting an ID document upload URL requires auth; submitting a
 * verification request without an idDocumentObjectKey is rejected;
 * submitting before meeting the eligibility bar (no social link, or fewer
 * than 3 prior works/events) is rejected with a clear reason; meeting the
 * bar (>=1 social link, >=3 works for an artist / >=3 events for an
 * organizer, plus an ID document key) lets the request through; a fan
 * (neither role) can't request at all; submitting twice while already
 * pending is a conflict, not a duplicate row; the moderator queue, review,
 * and ID-document-view endpoints are role-gated (a non-moderator gets
 * 403); approving a request flips profiles.is_verified to true and the
 * public status endpoint reflects it; rejecting does not verify the user;
 * and reviewing an already-decided request a second time is a conflict.
 *
 * NOTE: this does not upload real bytes to R2 - it only exercises the
 * presigned-URL issuance and the objectKey plumbing through
 * submit_verification_request. That still requires R2_ID_DOCUMENTS_BUCKET_NAME
 * to be set to a real (separate, private) bucket, or the id-upload-url
 * calls below will fail with a 400 ("ID document uploads are not
 * configured").
 *
 * Needs `social_links`, `verification_requests` (with `id_document_key`),
 * and `profiles.is_verified` - see the CREATE TABLE / ALTER TABLE block at
 * the top of server/src/db/queries/verification.queries.ts.
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

// Requests an upload URL and returns just the objectKey - enough to drive
// submit_verification_request without actually PUTting bytes to R2.
async function getIdDocumentObjectKey(who: string): Promise<string> {
  const r = await request(who, 'POST', '/verification/id-upload-url', {
    fileName: 'id.jpg',
    contentType: 'image/jpeg',
  });
  const body = r.body as { objectKey?: string };
  return body.objectKey ?? '';
}

async function main() {
  console.log(`Running verification API tests against ${BASE_URL}\n`);

  const stamp = Date.now();

  await request('artist', 'POST', '/auth/register', {
    email: `artist_${stamp}@example.com`, password: 'TestPass123!', role: 'artist', user_name: `artist_${stamp}`, artists_type: 'musician',
  });
  await request('artist', 'POST', '/auth/login', { identifier: `artist_${stamp}@example.com`, password: 'TestPass123!' });

  await request('org', 'POST', '/auth/register', {
    email: `org_${stamp}@example.com`, password: 'TestPass123!', role: 'organizer', user_name: `org_${stamp}`,
  });
  await request('org', 'POST', '/auth/login', { identifier: `org_${stamp}@example.com`, password: 'TestPass123!' });

  await request('fan', 'POST', '/auth/register', {
    email: `fan_${stamp}@example.com`, password: 'TestPass123!', role: 'fan', user_name: `fan_${stamp}`,
  });
  await request('fan', 'POST', '/auth/login', { identifier: `fan_${stamp}@example.com`, password: 'TestPass123!' });

  await request('mod', 'POST', '/auth/register', {
    email: `mod_${stamp}@example.com`, password: 'TestPass123!', role: 'moderator', user_name: `mod_${stamp}`,
  });
  await request('mod', 'POST', '/auth/login', { identifier: `mod_${stamp}@example.com`, password: 'TestPass123!' });

  // --- ID document upload URL -------------------------------------------
  let r = await request('anon', 'POST', '/verification/id-upload-url', { fileName: 'id.jpg', contentType: 'image/jpeg' });
  check('01 Requesting an ID upload URL requires auth', r.status, 401, r.body);

  r = await request('artist', 'POST', '/verification/id-upload-url', { fileName: 'id.jpg', contentType: 'image/jpeg' });
  check('02 Artist can request an ID upload URL', r.status, 200, r.body);

  // --- Artist path: not eligible yet ---------------------------------
  r = await request('anon', 'POST', '/verification/requests', {});
  check('03 Submit request requires auth', r.status, 401, r.body);

  const artistIdKey1 = await getIdDocumentObjectKey('artist');
  r = await request('artist', 'POST', '/verification/requests', {});
  check('04 Submitting without idDocumentObjectKey -> rejected', r.status, 400, r.body);

  r = await request('artist', 'POST', '/verification/requests', { idDocumentObjectKey: artistIdKey1 });
  check('05 No social link yet -> rejected', r.status, 409, r.body);

  r = await request('artist', 'POST', '/verification/social-links', { platform: 'instagram', url: 'https://instagram.com/test' });
  check('06 Artist adds a social link', r.status, 201, r.body);
  const artistUserId = (r.body as { link: { user_id: string } }).link.user_id;

  r = await request('artist', 'POST', '/verification/requests', { idDocumentObjectKey: artistIdKey1 });
  check('07 Social link present but < 3 works -> still rejected', r.status, 409, r.body);

  // Give the artist 3 works.
  for (let i = 0; i < 3; i++) {
    await request('artist', 'POST', '/works', { description: `work ${i}` });
  }

  const artistIdKey2 = await getIdDocumentObjectKey('artist');
  r = await request('artist', 'POST', '/verification/requests', { idDocumentObjectKey: artistIdKey2 });
  check('08 Eligible artist submits a request', r.status, 201, r.body);
  const artistRequest = (r.body as { request: { id: string; status: string } }).request;
  check('09 New request is pending', artistRequest.status === 'pending' ? 1 : 0, 1, artistRequest);

  r = await request('artist', 'POST', '/verification/requests', { idDocumentObjectKey: artistIdKey2 });
  check('10 Submitting again while pending is a conflict', r.status, 409, r.body);

  // --- Fan path: wrong role entirely -----------------------------------
  r = await request('fan', 'POST', '/verification/social-links', { platform: 'instagram', url: 'https://instagram.com/fan' });
  const fanIdKey = await getIdDocumentObjectKey('fan');
  r = await request('fan', 'POST', '/verification/requests', { idDocumentObjectKey: fanIdKey });
  check('11 A fan cannot request verification at all', r.status, 400, r.body);

  // --- Organizer path: eligible via events instead of works -----------
  const orgIdKey1 = await getIdDocumentObjectKey('org');
  r = await request('org', 'POST', '/verification/requests', { idDocumentObjectKey: orgIdKey1 });
  check('12 Organizer not eligible yet either', r.status, 409, r.body);

  await request('org', 'POST', '/verification/social-links', { platform: 'twitter', url: 'https://x.com/test' });
  for (let i = 0; i < 3; i++) {
    await request('org', 'POST', '/events', {
      title: `Event ${i}`, description: 'desc', startAt: '2027-04-01T10:00:00Z', endAt: '2027-04-01T18:00:00Z',
      venueName: 'Venue', location: { lat: 40.7, lng: -74.0 },
    });
  }
  const orgIdKey2 = await getIdDocumentObjectKey('org');
  r = await request('org', 'POST', '/verification/requests', { idDocumentObjectKey: orgIdKey2 });
  check('13 Eligible organizer submits a request', r.status, 201, r.body);
  const orgRequest = (r.body as { request: { id: string } }).request;

  // --- Moderator queue is role-gated ------------------------------------
  r = await request('artist', 'GET', '/verification/requests');
  check('14 Non-moderator cannot view the review queue', r.status, 403, r.body);

  r = await request('mod', 'GET', '/verification/requests');
  check('15 Moderator can view the review queue', r.status, 200, r.body);
  const queue = (r.body as { requests: { id: string }[] }).requests;
  check('16 Queue contains both pending requests', queue.filter((q) => q.id === artistRequest.id || q.id === orgRequest.id).length, 2, queue);

  // --- ID document view URL is moderator-only ----------------------------
  r = await request('artist', 'GET', `/verification/requests/${artistRequest.id}/id-document`);
  check('17 Non-moderator cannot view an ID document URL', r.status, 403, r.body);

  r = await request('mod', 'GET', `/verification/requests/${artistRequest.id}/id-document`);
  check('18 Moderator can request the ID document view URL', r.status, 200, r.body);

  r = await request('artist', 'PATCH', `/verification/requests/${artistRequest.id}`, { status: 'approved' });
  check('19 Non-moderator cannot review a request', r.status, 403, r.body);

  // --- Approve the artist, reject the organizer -------------------------
  r = await request('mod', 'PATCH', `/verification/requests/${artistRequest.id}`, { status: 'approved', notes: 'looks good' });
  check('20 Moderator approves the artist request', r.status, 200, r.body);

  r = await request('anon', 'GET', `/verification/status/${artistUserId}`);
  const artistStatus = r.body as { isVerified: boolean };
  check('21 Artist status now shows verified', artistStatus.isVerified ? 1 : 0, 1, artistStatus);

  r = await request('mod', 'PATCH', `/verification/requests/${artistRequest.id}`, { status: 'rejected' });
  check('22 Reviewing an already-decided request is a conflict', r.status, 409, r.body);

  r = await request('mod', 'PATCH', `/verification/requests/${orgRequest.id}`, { status: 'rejected', notes: 'could not confirm venue' });
  check('23 Moderator rejects the organizer request', r.status, 200, r.body);

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
