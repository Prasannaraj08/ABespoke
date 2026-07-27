import { Router } from 'express';
import authRouter from './auth';
import productsRouter from './products';
import cartRouter from './cart';
import wishlistRouter from './wishlist';
import ordersRouter from './orders';
import addressesRouter from './addresses';
import couponsRouter from './coupons';
import boutiqueRouter from './boutique';
import designerRouter from './designer';
import adminRouter from './admin';
import uploadRouter from './upload';

const router = Router();

// Delegate to feature-specific sub-routers
router.use('/auth', authRouter);
router.use('/products', productsRouter);
router.use('/cart', cartRouter);
router.use('/wishlist', wishlistRouter);
router.use('/orders', ordersRouter);
router.use('/addresses', addressesRouter);
router.use('/coupons', couponsRouter);
router.use('/boutique', boutiqueRouter);
router.use('/designer', designerRouter);
router.use('/admin', adminRouter);
router.use('/upload', uploadRouter);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

export default router;
