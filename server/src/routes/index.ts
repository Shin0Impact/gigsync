import { Router } from 'express';
import authRoutes from './auth.routes';
import artistsRoutes from './artists.routes';
import eventsRoutes from './events.routes';
import mediaRoutes from './media.routes';
import conversationsRoutes from './conversations.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/artists', artistsRoutes);
router.use('/events', eventsRoutes);
router.use('/media', mediaRoutes);
router.use('/conversations', conversationsRoutes);

export default router;
