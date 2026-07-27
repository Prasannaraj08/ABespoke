import { Router } from 'express';
import { applyCoupon } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Secure pricing coupon applying endpoints
router.post('/apply', authenticateToken, applyCoupon);

export default router;
