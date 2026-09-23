import { Router } from 'express';
import authRoutes from './auth.routes';
import artistsRoutes from './artists.routes';
import eventsRoutes from './events.routes';
import mediaRoutes from './media.routes';
import conversationsRoutes from './conversations.routes';
import worksRoutes from './works.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/artists', artistsRoutes);
router.use('/events', eventsRoutes);
router.use('/media', mediaRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/works', worksRoutes);

export default router;
