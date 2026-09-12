import { Router } from 'express';
import { login, logout, me, register, switchRole } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.post('/switch-role', switchRole);

export default router;
