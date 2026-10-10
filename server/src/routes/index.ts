import { Router } from 'express';
import authRoutes from './auth.routes';
import artistsRoutes from './artists.routes';
import eventsRoutes from './events.routes';
import mediaRoutes from './media.routes';
import conversationsRoutes from './conversations.routes';
import worksRoutes from './works.routes';
import verificationRoutes from './verification.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/artists', artistsRoutes);
router.use('/events', eventsRoutes);
router.use('/media', mediaRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/works', worksRoutes);
router.use('/verification', verificationRoutes);
router.use('/users', usersRoutes);

export default router;
