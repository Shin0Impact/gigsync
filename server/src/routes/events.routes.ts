import { Router } from 'express';
import { mockApplications, mockEvents } from '../db/mockStore';

const router = Router();

// GET /api/events
router.get('/', (req, res) => {
  const { category, status } = req.query;

  let events = [...mockEvents];

  if (category && category !== 'all') {
    const cat = String(category).toLowerCase();
    events = events.filter((e) =>
      e.categoriesNeeded.some((c: string) => c.toLowerCase().includes(cat))
    );
  }

  if (status) {
    events = events.filter((e) => e.status === status);
  }

  res.json({ events, total: events.length });
});

// GET /api/events/applications
router.get('/applications/all', (_req, res) => {
  res.json({ applications: mockApplications });
});

// POST /api/events
router.post('/', (req, res) => {
  const { title, description, venueName, eventDate, categoriesNeeded, budget } = req.body;

  if (!title || !venueName) {
    return res.status(400).json({ error: 'Title and venueName are required' });
  }

  const newEvent = {
    id: `event-${Date.now()}`,
    organizerId: req.body.organizerId || 'user-org-1',
    title,
    description: description || '',
    venueName,
    eventDate: eventDate || 'TBD',
    status: 'open' as const,
    categoriesNeeded: Array.isArray(categoriesNeeded) && categoriesNeeded.length > 0
      ? categoriesNeeded
      : ['Music'],
    budget: budget ? Number(budget) : undefined,
  };

  mockEvents.unshift(newEvent);
  res.status(201).json({ event: newEvent });
});

// POST /api/events/:id/apply
router.post('/:id/apply', (req, res) => {
  const eventId = req.params.id;
  const event = mockEvents.find((e) => e.id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { artistId, artistName, artistAvatar, category, rateProposed, pitch } = req.body;

  const newApp = {
    id: `app-${Date.now()}`,
    eventId,
    artistId: artistId || 'artist-1',
    artistName: artistName || 'Alex Rivers',
    artistAvatar: artistAvatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face',
    category: category || event.categoriesNeeded[0] || 'Music',
    rateProposed: Number(rateProposed) || 200,
    pitch: pitch || 'Excited to perform for your venue!',
    status: 'pending' as const,
    createdAt: 'Just now',
  };

  mockApplications.unshift(newApp);
  res.status(201).json({ application: newApp });
});

// PATCH /api/events/applications/:appId
router.patch('/applications/:appId', (req, res) => {
  const { appId } = req.params;
  const { status } = req.body;

  const app = mockApplications.find((a) => a.id === appId);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
    app.status = status;
  }

  res.json({ application: app });
});

export default router;
