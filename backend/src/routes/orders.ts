import { Router } from 'express';
import { getOrders, getOrderById, createOrder, downloadInvoice } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { orderSchema } from '../validators/schemas';

const router = Router();

// Secure all order lifecycle endpoints
router.use(authenticateToken);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', validateBody(orderSchema), createOrder);
router.get('/:id/invoice', downloadInvoice);

export default router;
