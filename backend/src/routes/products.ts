import { Router } from 'express';
import { getProducts, getProductById, getCategoriesAndBrands, addProductReview } from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { reviewSchema } from '../validators/schemas';

const router = Router();

router.get('/', getProducts);
router.get('/meta', getCategoriesAndBrands);
router.get('/:id', getProductById);
router.post('/:id/review', authenticateToken, validateBody(reviewSchema), addProductReview);

export default router;
