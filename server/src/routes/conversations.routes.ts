import { Router } from 'express';
import { mockConversations, mockMessages, mockUsers } from '../db/mockStore';

const router = Router();

// GET /api/conversations
router.get('/', (_req, res) => {
  res.json({ conversations: mockConversations });
});

// POST /api/conversations
router.post('/', (req, res) => {
  const { partnerId, eventId } = req.body;

  const partner = mockUsers[partnerId] || {
    id: partnerId || 'user-artist-1',
    name: 'Performer',
    role: 'artist',
  };

  const existing = mockConversations.find(
    (c) => c.partner.id === partnerId || (c.eventId && c.eventId === eventId)
  );

  if (existing) {
    return res.json({ conversation: existing });
  }

  const newConv = {
    id: `conv-${Date.now()}`,
    eventId: eventId || null,
    participantIds: ['user-org-1', partner.id],
    updatedAt: new Date().toISOString(),
    partner: {
      id: partner.id,
      name: partner.name,
      avatarUrl: partner.avatarUrl || undefined,
      role: partner.role,
    },
    lastMessage: 'Conversation started',
  };

  mockConversations.unshift(newConv);
  mockMessages[newConv.id] = [
    {
      id: `msg-${Date.now()}`,
      conversationId: newConv.id,
      senderId: 'user-org-1',
      content: `Hello ${partner.name}! Let's connect regarding the gig.`,
      isRead: true,
      createdAt: 'Just now',
    },
  ];

  res.status(201).json({ conversation: newConv });
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', (req, res) => {
  const convId = req.params.id;
  const messages = mockMessages[convId] || [];
  res.json({ messages });
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', (req, res) => {
  const convId = req.params.id;
  const { content, senderId } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Message content required' });
  }

  if (!mockMessages[convId]) {
    mockMessages[convId] = [];
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId: convId,
    senderId: senderId || 'user-org-1',
    content,
    isRead: false,
    createdAt: 'Just now',
  };

  mockMessages[convId].push(newMsg);

  const conv = mockConversations.find((c) => c.id === convId);
  if (conv) {
    conv.lastMessage = content;
    conv.updatedAt = new Date().toISOString();
  }

  res.status(201).json({ message: newMsg });
});

export default router;
