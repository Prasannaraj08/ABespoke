import { Router } from 'express';
import { getAddresses, addAddress, updateAddress, deleteAddress } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { addressSchema } from '../validators/schemas';

const router = Router();

// Secure all shipping address endpoints
router.use(authenticateToken);

router.get('/', getAddresses);
router.post('/', validateBody(addressSchema), addAddress);
router.put('/:id', validateBody(addressSchema), updateAddress);
router.delete('/:id', deleteAddress);

export default router;
