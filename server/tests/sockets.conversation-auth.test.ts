/**
 * API/socket tests for the conversation membership gate on the Socket.IO
 * gateway (security fix: join_conversation/send_message previously did
 * zero authorization - any authenticated user could join or send into ANY
 * conversation room just by guessing/knowing a UUID).
 *
 * REST /api/conversations is still a 501 stub (see
 * routes/conversations.routes.ts), so there's no HTTP endpoint yet to
 * create a conversation or add a participant. This file talks to the DB
 * directly (via ../src/config/db) to set up that fixture data instead -
 * every other *.api.test.ts file only hits the HTTP API because the REST
 * layer they're testing already exists; this one doesn't have that luxury
 * yet. Everything it creates is cleaned up at the end so repeated runs
 * against the shared Supabase DB don't accumulate rows.
 *
 * Run with the server already running locally, then from server/:
 *
 *   npm run test:sockets
 */
import { io as ioClient, Socket } from 'socket.io-client';
import { query } from '../src/config/db';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api';
const SOCKET_URL = process.env.SOCKET_URL ?? 'http://localhost:4000';

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

// --- HTTP helper (registers a real user, returns its session Cookie header
// string so the socket handshake can reuse the exact same access_token) ---
async function registerAndGetCookie(email: string, userName: string): Promise<{ cookie: string; userId: string }> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Test1234!',
      role: 'artist',
      user_name: userName,
      artists_type: 'musician',
    }),
  });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  const body = (await res.json()) as { user?: { id: string } };
  if (res.status !== 201 || !body.user?.id) {
    throw new Error(`Failed to register fixture user ${email}: ${res.status} ${JSON.stringify(body)}`);
  }
  return { cookie, userId: body.user.id };
}

// --- socket helper: connect, resolving once actually connected ---
function connectSocket(cookie: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(SOCKET_URL, {
      extraHeaders: { Cookie: cookie },
      forceNew: true,
      reconnection: false,
      timeout: 5000,
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (err) => reject(err));
  });
}

// --- waits for either a specific success event or 'socket_error', so a
// single call can assert "this was accepted" or "this was rejected" ---
function emitAndWait(
  socket: Socket,
  event: string,
  payload: unknown,
  successEvent: string
): Promise<{ outcome: 'success' | 'error'; data: unknown }> {
  return new Promise((resolve) => {
    const onSuccess = (data: unknown) => {
      cleanup();
      resolve({ outcome: 'success', data });
    };
    const onError = (data: unknown) => {
      cleanup();
      resolve({ outcome: 'error', data });
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve({ outcome: 'error', data: { message: 'timed out waiting for a response' } });
    }, 4000);
    function cleanup() {
      clearTimeout(timer);
      socket.off(successEvent, onSuccess);
      socket.off('socket_error', onError);
    }
    socket.once(successEvent, onSuccess);
    socket.once('socket_error', onError);
    socket.emit(event, payload);
  });
}

async function main() {
  console.log(`Running socket conversation-auth tests against ${SOCKET_URL}\n`);

  const stamp = Date.now();
  const member = await registerAndGetCookie(`sock_member_${stamp}@example.com`, `sock_member_${stamp}`);
  const outsider = await registerAndGetCookie(`sock_outsider_${stamp}@example.com`, `sock_outsider_${stamp}`);

  // Fixture: one conversation, with `member` as its only participant.
  const convResult = await query<{ id: string }>(
    'INSERT INTO conversations DEFAULT VALUES RETURNING id'
  );
  const conversationId = convResult.rows[0].id;
  await query('INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)', [
    conversationId,
    member.userId,
  ]);

  const memberSocket = await connectSocket(member.cookie);
  const outsiderSocket = await connectSocket(outsider.cookie);

  try {
    // 1. The actual participant can join.
    let res = await emitAndWait(memberSocket, 'join_conversation', conversationId, 'joined_conversation');
    check('01 Participant can join_conversation', res.outcome === 'success', res.data);

    // 2. A non-participant is rejected, not silently let in.
    res = await emitAndWait(outsiderSocket, 'join_conversation', conversationId, 'joined_conversation');
    check('02 Non-participant join_conversation is rejected', res.outcome === 'error', res.data);

    // 3. A non-participant can't send a message into it either, even
    // though the conversation row genuinely exists (so this isn't just
    // the FK-fallback in persistMessage - it's the membership check).
    res = await emitAndWait(
      outsiderSocket,
      'send_message',
      { conversationId, content: 'should not be allowed' },
      'receive_message'
    );
    check('03 Non-participant send_message is rejected', res.outcome === 'error', res.data);

    // 4. Confirm nothing from the rejected attempt actually landed in the
    // DB - the check has to happen before persistMessage runs, not just
    // fail the client-visible ack while a row still gets written.
    const leaked = await query('SELECT 1 FROM messages WHERE conversation_id = $1 AND sender_id = $2', [
      conversationId,
      outsider.userId,
    ]);
    check('04 No message row was written by the rejected outsider', (leaked.rowCount ?? 0) === 0, leaked.rows);

    // 5. The real participant can send a message, and it's actually
    // persisted (proves the fix didn't just move the bug to false-reject
    // legitimate participants too).
    res = await emitAndWait(
      memberSocket,
      'send_message',
      { conversationId, content: 'hello from a real participant' },
      'receive_message'
    );
    check('05 Participant send_message succeeds', res.outcome === 'success', res.data);

    const persisted = await query('SELECT 1 FROM messages WHERE conversation_id = $1 AND sender_id = $2', [
      conversationId,
      member.userId,
    ]);
    check('06 Participant message was actually persisted', (persisted.rowCount ?? 0) === 1, persisted.rows);

    // 7. Empty conversationId on join is rejected outright, not treated as
    // "join room named empty string".
    res = await emitAndWait(outsiderSocket, 'join_conversation', '', 'joined_conversation');
    check('07 Empty conversationId is rejected', res.outcome === 'error', res.data);
  } finally {
    memberSocket.disconnect();
    outsiderSocket.disconnect();

    // Clean up every fixture row this run created, in FK-safe order, so
    // the shared Supabase DB doesn't accumulate test data across runs.
    await query('DELETE FROM messages WHERE conversation_id = $1', [conversationId]);
    await query('DELETE FROM conversation_participants WHERE conversation_id = $1', [conversationId]);
    await query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    await query('DELETE FROM users WHERE id = $1', [member.userId]);
    await query('DELETE FROM users WHERE id = $1', [outsider.userId]);

    const { pool } = await import('../src/config/db');
    await pool.end();
  }

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
