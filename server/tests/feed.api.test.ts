/**
 * API tests for the homepage feed endpoints (frontend "Timeline +
 * Discovery"):
 *   GET /api/feed/timeline   - work updates + events from accounts the
 *                              viewer follows, newest first (auth required)
 *   GET /api/feed/discovery  - the most recent updates + events from ALL
 *                              accounts, newest first (public)
 *
 * Same pattern as works.api.test.ts. Run with the server already running
 * locally, then from server/:
 *
 *   npm run test:feed
 *
 * Covers: discovery is public; timeline rejects anonymous viewers; timeline
 * only surfaces followed accounts; following an organizer adds their events;
 * a user who follows nobody gets an empty timeline; the item shape for both
 * types (author, work/update/media vs event summary); chronological
 * ordering; and limit/offset pagination. Assertions about "our" fixture
 * items use stamp-suffixed titles because the shared DB already contains
 * rows from every other suite.
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
    // empty body - fine
  }

  return { status: res.status, body: json };
}

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    if (detail !== undefined) console.log(`    ${JSON.stringify(detail)}`);
    failed++;
  }
}

async function main() {
  console.log(`Running feed API tests against ${BASE_URL}\n`);

  const stamp = Date.now();
  const workTitleA = `Feed Work A ${stamp}`;
  const workTitleB = `Feed Work B ${stamp}`;
  const eventTitle = `Feed Event ${stamp}`;

  // --- Fixture users: two artists, an organizer, and a fan viewer --------
  for (const who of ['artistA', 'artistB', 'org', 'fan']) {
    const role = who === 'org' ? 'organizer' : who === 'fan' ? 'fan' : 'artist';
    await request(who, 'POST', '/auth/register', {
      email: `${who}_${stamp}@example.com`,
      password: 'TestPass123!',
      role,
      user_name: `${who}_${stamp}`,
      ...(role === 'artist' ? { artists_type: 'musician' } : {}),
    });
    await request(who, 'POST', '/auth/login', {
      identifier: `${who}_${stamp}@example.com`,
      password: 'TestPass123!',
    });
  }

  const ids: Record<string, string> = {};
  for (const who of ['artistA', 'artistB', 'org', 'fan']) {
    const me = await request(who, 'GET', '/auth/me');
    ids[who] = me.body.user.userId;
  }

  // --- Fixture content ----------------------------------------------------
  // artistA: work with two updates, the newest carrying one media row.
  let r = await request('artistA', 'POST', '/works', { title: workTitleA, description: 'first' });
  const workAId = r.body.work.id;
  await request('artistA', 'POST', `/works/${workAId}/updates`, { description: 'update one' });
  r = await request('artistA', 'POST', `/works/${workAId}/updates`, { description: 'update two' });
  const updA2Id = r.body.update.id;
  r = await request('artistA', 'POST', `/works/updates/${updA2Id}/media`, {
    mediaType: 'image',
    objectKey: `feed/${stamp}-a2.png`,
    mimeType: 'image/png',
    fileSizeBytes: 10,
    sortOrder: 0,
  });
  check('Fixture: media row attached to artistA update', r.status === 201, r.body);

  // artistB: work with one update (never followed by fan).
  r = await request('artistB', 'POST', '/works', { title: workTitleB, description: 'solo' });
  const workBId = r.body.work.id;
  await request('artistB', 'POST', `/works/${workBId}/updates`, { description: 'only update' });

  // org: one event (followed later in the run).
  r = await request('org', 'POST', '/events', {
    title: eventTitle,
    description: 'a feed-worthy night',
    startAt: new Date(Date.now() + 86400000).toISOString(),
    endAt: new Date(Date.now() + 90000000).toISOString(),
    venueName: 'The Feed Club',
    location: { lat: 40.7128, lng: -74.006 },
    categoriesNeeded: ['musician'],
  });
  check('Fixture: organizer creates an event', r.status === 201, r.body);

  // --- Discovery (public) --------------------------------------------------
  r = await request('anon', 'GET', '/feed/discovery');
  check('01 Discovery is public (200)', r.status === 200, r.body);
  let items: any[] = r.body?.items ?? [];
  check('02 Discovery returns items array', Array.isArray(items), r.body);
  check(
    '03 Discovery mixes updates and events',
    items.some((i) => i.type === 'work_update') && items.some((i) => i.type === 'event'),
    items.map((i) => i.type)
  );
  const ours = items.filter((i) =>
    (i.type === 'work_update' && i.work?.title === workTitleA) ||
    (i.type === 'event' && i.event?.title === eventTitle)
  );
  check('04 Discovery contains the fixture update and event', ours.length >= 3, ours.length);
  const timestamps = items.map((i) => new Date(i.createdAt).getTime());
  check(
    '05 Discovery is newest-first',
    timestamps.every((t, idx) => idx === 0 || t <= timestamps[idx - 1]),
    timestamps.slice(0, 5)
  );

  // --- Timeline auth + empty-follows cases --------------------------------
  r = await request('anon', 'GET', '/feed/timeline');
  check('06 Timeline rejects anonymous viewers (401)', r.status === 401, r.body);

  r = await request('fan', 'GET', '/feed/timeline');
  check('07 Timeline works for a user following nobody (200)', r.status === 200, r.body);
  check('08 Timeline with no follows is empty', (r.body?.items ?? []).length === 0, r.body);

  // --- Timeline with one followed artist -----------------------------------
  r = await request('fan', 'POST', `/profiles/artistA_${stamp}/follow`);
  check('09 Fan follows artistA', r.status < 300, r.body);

  r = await request('fan', 'GET', '/feed/timeline');
  items = r.body?.items ?? [];
  check('10 Timeline has items after following', items.length >= 2, items.length);
  check(
    '11 Timeline only shows followed accounts',
    items.length > 0 && items.every((i) => i.author.userId === ids.artistA),
    items.map((i) => i.author.userId)
  );
  check(
    '12 Timeline excludes the unfollowed artistB and the event',
    items.every((i) => i.type === 'work_update' && i.work.title !== workTitleB),
    items.map((i) => `${i.type}:${i.type === 'work_update' ? i.work.title : i.event.title}`)
  );

  const updItem = items.find((i) => i.update?.id === updA2Id);
  check(
    '13 Update item carries work, update and author shape',
    Boolean(
      updItem &&
        updItem.work.id === workAId &&
        updItem.work.title === workTitleA &&
        updItem.update.versionNumber != null &&
        updItem.author.userName === `artistA_${stamp}`
    ),
    updItem
  );
  check(
    '14 Update item embeds its media',
    Boolean(updItem && updItem.media.length === 1 && updItem.media[0].r2Key === `feed/${stamp}-a2.png`),
    updItem?.media
  );

  // --- Following the organizer adds their events ----------------------------
  r = await request('fan', 'POST', `/profiles/org_${stamp}/follow`);
  check('15 Fan follows the organizer', r.status < 300, r.body);

  r = await request('fan', 'GET', '/feed/timeline');
  items = r.body?.items ?? [];
  const eventItem = items.find((i) => i.type === 'event' && i.event?.title === eventTitle);
  check('16 Timeline now includes the organizer event', Boolean(eventItem), items.map((i) => i.type));
  check(
    '17 Event item carries summary + organizer as author',
    Boolean(
      eventItem &&
        eventItem.event.venueName === 'The Feed Club' &&
        eventItem.event.categoriesNeeded?.includes('musician') &&
        eventItem.author.userId === ids.org
    ),
    eventItem
  );

  // --- Pagination -----------------------------------------------------------
  r = await request('anon', 'GET', '/feed/discovery?limit=1');
  check('18 limit=1 returns a single item', (r.body?.items ?? []).length === 1, r.body);
  const firstId = `${r.body.items[0].type}:${r.body.items[0].id}`;

  r = await request('anon', 'GET', '/feed/discovery?limit=1&offset=1');
  check('19 offset=1 skips the newest item', (r.body?.items ?? []).length === 1, r.body);
  check(
    '20 Pagination pages are distinct',
    Boolean(r.body?.items?.[0]) && `${r.body.items[0].type}:${r.body.items[0].id}` !== firstId,
    r.body
  );

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
