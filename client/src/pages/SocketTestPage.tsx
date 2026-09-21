import { FormEvent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/store';
import { attachSocketListeners } from '../sockets/listeners';
import { connectSocket, joinConversation, sendMessage } from '../sockets/client';

// TEMPORARY: proves the Socket.IO pipe (server + client + Redux) works
// end-to-end before there's a real chat UI to build it into. Delete this
// page once Jinad's chat UI lands and wire sendMessage/joinConversation/
// attachSocketListeners into that instead - the pieces underneath
// (sockets/client.ts, sockets/listeners.ts, chatSlice) don't change.
//
// How to test: open this page in two browser tabs. Use a different "User
// ID" in each tab but the SAME "Conversation ID", connect both, then send a
// message from one tab and watch it appear in both.
function SocketTestPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [userId, setUserId] = useState('user-a');
  const [conversationId, setConversationId] = useState('test-convo-1');
  const [connected, setConnected] = useState(false);
  const [draft, setDraft] = useState('');

  const messages = useSelector(
    (state: RootState) => state.chat.messages[conversationId] ?? []
  );

  function handleConnect() {
    connectSocket(userId);
    attachSocketListeners(dispatch);
    joinConversation(conversationId);
    setConnected(true);
  }

  function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(conversationId, draft);
    setDraft('');
  }

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 480 }}>
      <h1>Socket.IO test</h1>
      <p style={{ color: '#666' }}>
        Temporary page — proves real-time messaging works before the real chat UI exists.
      </p>

      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        User ID{' '}
        <input value={userId} onChange={(e) => setUserId(e.target.value)} disabled={connected} />
      </label>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        Conversation ID{' '}
        <input
          value={conversationId}
          onChange={(e) => setConversationId(e.target.value)}
          disabled={connected}
        />
      </label>
      <button onClick={handleConnect} disabled={connected}>
        {connected ? 'Connected ✓' : 'Connect + join room'}
      </button>

      <hr style={{ margin: '1.5rem 0' }} />

      <ul style={{ listStyle: 'none', padding: 0, minHeight: '4rem' }}>
        {messages.map((m: (typeof messages)[number]) => (
          <li key={m.id}>
            <strong>{m.senderId}:</strong> {m.content}
          </li>
        ))}
        {messages.length === 0 && <li style={{ color: '#999' }}>No messages yet.</li>}
      </ul>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          disabled={!connected}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={!connected}>
          Send
        </button>
      </form>
    </main>
  );
}

export default SocketTestPage;
