import { Router } from 'express';
import { 
  User as UserModel, 
  BoutiqueProfile as BoutiqueProfileModel, 
  DesignerProfile as DesignerModel 
} from '../db/models';
import { 
  getDashboardStats, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getAllOrders, 
  getAllCoupons, 
  createCoupon, 
  deleteCoupon 
} from '../controllers/adminController';
import { updateOrderStatus } from '../controllers/orderController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { productSchema } from '../validators/schemas';

const router = Router();

// Secure all admin routes behind token authentication and admin authorization checks
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Product inventory adjustments (validated)
router.post('/products', validateBody(productSchema), createProduct);
router.put('/products/:id', validateBody(productSchema), updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Coupons management
router.get('/coupons', getAllCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:code', deleteCoupon);

// --- Admin verified users check ---
router.get('/users', async (req, res) => {
  try {
    const users = await UserModel.findAll();
    const boutiques = await BoutiqueProfileModel.findAll();
    const designers = await DesignerModel.findAll();

    const formattedUsers = users.map(u => {
      let detail: any = {};
      let verified = true;
      if (u.role === 'boutique') {
        const b = boutiques.find(bp => bp.userId === u.id);
        detail = b ? b.get({ plain: true }) : {};
        verified = detail.verified ?? false;
      } else if (u.role === 'designer') {
        const d = designers.find(dp => dp.userId === u.id);
        detail = d ? d.get({ plain: true }) : {};
        verified = detail.verified ?? false;
      }
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        verified,
        createdAt: u.createdAt,
        detail
      };
    });
    res.status(200).json(formattedUsers);
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin verify user
router.put('/users/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (verified === undefined) {
      return res.status(400).json({ message: 'Verified boolean status parameter is required' });
    }

    const user = await UserModel.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'boutique') {
      await BoutiqueProfileModel.update({ verified }, { where: { userId: id } });
    } else if (user.role === 'designer') {
      await DesignerModel.update({ verified }, { where: { userId: id } });
    }
    res.status(200).json({ message: `Verification status updated for user ${id}`, verified });
  } catch (err) {
    console.error('Admin verify user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
