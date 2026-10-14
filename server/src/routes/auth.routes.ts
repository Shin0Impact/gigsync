import { Router } from 'express';
import {
  change_password_handler,
  forgot_password_handler,
  login,
  logout,
  me,
  refresh,
  register,
  resend_verification_handler,
  reset_password_handler,
  verify_email_handler,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import {
  loginRateLimiter,
  passwordResetRateLimiter,
  registerRateLimiter,
} from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', registerRateLimiter, register);
router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

// Account recovery. change-password + resend-verification need a session;
// forgot/reset/verify are public by design (token possession IS the
// credential). Only the email-triggering routes are rate-limited - reset
// and verify consume single-use 256-bit tokens, which don't brute-force.
router.post('/change-password', requireAuth, change_password_handler);
router.post('/forgot-password', passwordResetRateLimiter, forgot_password_handler);
router.post('/reset-password', reset_password_handler);
router.post('/verify-email', verify_email_handler);
router.post('/resend-verification', requireAuth, passwordResetRateLimiter, resend_verification_handler);

export default router;
