import { Router } from 'express';
import { getCart, updateCart } from '../controllers/cartController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Secure all endpoints under auth guards
router.use(authenticateToken);

router.get('/', getCart);
router.post('/', updateCart);

export default router;
