import { Router } from 'express';
import { getWishlist, toggleWishlist } from '../controllers/cartController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Secure all wishlist paths
router.use(authenticateToken);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);

export default router;
