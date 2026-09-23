import { Router } from 'express';
import {
  login,
  logout,
  me,
  refresh,
  register,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', registerRateLimiter, register);
router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
