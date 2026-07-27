import { Router } from 'express';
import { register, login, googleLogin, getProfile, refreshToken, logout } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/schemas';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/google', authLimiter, googleLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);

export default router;
