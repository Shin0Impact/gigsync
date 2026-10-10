import { Router } from 'express';
import { get_user_handler } from '../controllers/users.controller';

const router = Router();

// GET /api/users/:identifier - public profile lookup by user UUID or
// user_name (powers mezzo.social/<user_name> profile pages).
router.get('/:identifier', get_user_handler);

export default router;
