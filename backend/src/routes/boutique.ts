import { Router, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../db/database';
import { 
  BoutiqueProfile as BoutiqueProfileModel,
  Order as OrderModel,
  Tailor as TailorModel,
  PortfolioItem as PortfolioModel,
  TailorRequirement as RequirementModel,
  Notification as NotificationModel,
  Product as ProductModel,
  User as UserModel
} from '../db/models';
import { authenticateToken, requireBoutique } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { 
  boutiqueProfileSchema, 
  tailorSchema, 
  portfolioItemSchema, 
  tailorRequirementSchema 
} from '../validators/schemas';

const router = Router();
const isPostgres = sequelize.getDialect() === 'postgres';

// ================= PRIVATE BOUTIQUE PORTAL PATHS =================

// Retrieve profile
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    let profile = await BoutiqueProfileModel.findByPk(req.user.id);
    if (!profile) {
      profile = await BoutiqueProfileModel.create({
        userId: req.user.id,
        boutiqueName: req.user.name || 'My Boutique',
        about: 'Curated fashion collection.',
        address: '',
        contactNumber: '',
        email: req.user.email || '',
        socialLinks: { instagram: '', facebook: '', twitter: '' },
        businessHours: '09:00 AM - 08:00 PM',
        experienceYears: 0,
        specialization: 'Bridal & Party Wear',
        verified: false,
        deliveryOptions: 'Standard Courier',
        pricingPolicy: 'Standard Retail',
        followersCount: 0
      });
    }
    res.status(200).json(profile.get({ plain: true }));
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', authenticateToken, requireBoutique, validateBody(boutiqueProfileSchema), async (req: any, res) => {
  try {
    const profile = await BoutiqueProfileModel.findByPk(req.user.id);
    if (!profile) {
      return res.status(404).json({ message: 'Boutique profile not found' });
    }

    const allowed = [
      'boutiqueName', 'logoUrl', 'bannerUrl', 'about', 'address', 
      'contactNumber', 'email', 'socialLinks', 'businessHours', 
      'experienceYears', 'specialization', 'deliveryOptions', 'pricingPolicy'
    ];
    
    const sanitized = Object.keys(req.body)
      .filter(key => allowed.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    await profile.update({
      ...sanitized,
      userId: req.user.id, // Immutable
      verified: profile.verified // Keep previous verification status
    });

    res.status(200).json(profile.get({ plain: true }));
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Orders — only orders that contain this boutique's products (filtered by brand)
router.get('/orders', authenticateToken, requireBoutique, async (req: any, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'))));

    // Get boutique profile to know its brand/name
    const profile = await BoutiqueProfileModel.findByPk(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Boutique profile not found', errorCode: 4040 });

    // Get product IDs that belong to this boutique (matched by brand name)
    const boutiqueProducts = await ProductModel.findAll({
      where: {
        brand: isPostgres
          ? { [Op.iLike]: profile.boutiqueName }
          : { [Op.like]: profile.boutiqueName },
      },
      attributes: ['id'],
      raw: true,
    });
    const productIds = boutiqueProducts.map((p: any) => p.id);

    if (productIds.length === 0) {
      return res.status(200).json({ success: true, data: [], pagination: { total: 0, page, limit, totalPages: 0, hasMore: false } });
    }

    // Fetch all orders and filter in app-layer for those containing this boutique's products
    // (SQL JSON filtering is dialect-specific; app-layer filter is portable)
    const allOrders = await OrderModel.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'userId', 'addressId', 'paymentMethod', 'paymentStatus', 'orderStatus', 'items', 'summary', 'createdAt'],
    });

    const productIdSet = new Set(productIds);
    const boutiqueOrders = allOrders.filter(order => {
      try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        return Array.isArray(items) && items.some((item: any) => productIdSet.has(item.productId));
      } catch { return false; }
    });

    const total = boutiqueOrders.length;
    const paginated = boutiqueOrders.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      data: paginated.map(o => o.get({ plain: true })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
    });
  } catch (err) {
    console.error('Get boutique orders error:', err);
    return res.status(500).json({ success: false, message: 'Server error', errorCode: 5000 });
  }
});

router.put('/orders/:id/status', authenticateToken, requireBoutique, async (req: any, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Order status is required' });

    const order = await OrderModel.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await order.update({ orderStatus: status });
    res.status(200).json(order.get({ plain: true }));
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Tailor management ---
router.get('/tailors', authenticateToken, requireBoutique, async (req: any, res) => {
  try {
    const tailors = await TailorModel.findAll({ where: { boutiqueId: req.user.id } });
    res.status(200).json(tailors.map(t => t.get({ plain: true })));
  } catch (err) {
    console.error('Get tailors error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/tailors', authenticateToken, requireBoutique, validateBody(tailorSchema), async (req: any, res) => {
  try {
    const newTailor = await TailorModel.create({
      id: `tailor_${Date.now()}`,
      boutiqueId: req.user.id,
      name: req.body.name,
      photoUrl: req.body.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
      experience: req.body.experience,
      specialization: req.body.specialization,
      certifications: req.body.certifications || [],
      workingHours: req.body.workingHours,
      languages: req.body.languages || [],
      bio: req.body.bio || '',
      rating: 5.0,
      projectsCount: 0
    });
    res.status(201).json(newTailor.get({ plain: true }));
  } catch (err) {
    console.error('Create tailor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/tailors/:id', authenticateToken, requireBoutique, async (req: any, res) => {
  try {
    const tailor = await TailorModel.findByPk(req.params.id);
    if (!tailor) return res.status(404).json({ message: 'Tailor not found' });
    
    if (tailor.boutiqueId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this resource.' });
    }

    await tailor.destroy();
    res.status(200).json({ message: 'Tailor deleted successfully' });
  } catch (err) {
    console.error('Delete tailor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Portfolio lookbook ---
router.get('/portfolio', authenticateToken, requireBoutique, async (req: any, res) => {
  try {
    const portfolios = await PortfolioModel.findAll({ where: { boutiqueId: req.user.id } });
    res.status(200).json(portfolios.map(p => p.get({ plain: true })));
  } catch (err) {
    console.error('Get portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/portfolio', authenticateToken, requireBoutique, validateBody(portfolioItemSchema), async (req: any, res) => {
  try {
    const newItem = await PortfolioModel.create({
      id: `port_${Date.now()}`,
      boutiqueId: req.user.id,
      images: req.body.images,
      designName: req.body.designName,
      category: req.body.category,
      description: req.body.description || '',
      fabric: req.body.fabric,
      stitchingType: req.body.stitchingType,
      completionTime: req.body.completionTime,
      customerReview: ''
    });
    res.status(201).json(newItem.get({ plain: true }));
  } catch (err) {
    console.error('Create portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/portfolio/:id', authenticateToken, requireBoutique, async (req: any, res) => {
  try {
    const item = await PortfolioModel.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Portfolio item not found' });

    if (item.boutiqueId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this resource.' });
    }

    await item.destroy();
    res.status(200).json({ message: 'Portfolio item deleted successfully' });
  } catch (err) {
    console.error('Delete portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Hiring desk ---
router.get('/hiring', authenticateToken, requireBoutique, async (req: any, res) => {
  try {
    const requirements = await RequirementModel.findAll({ where: { boutiqueId: req.user.id } });
    res.status(200).json(requirements.map(r => r.get({ plain: true })));
  } catch (err) {
    console.error('Get hiring error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/hiring', authenticateToken, requireBoutique, validateBody(tailorRequirementSchema), async (req: any, res) => {
  try {
    const newReq = await RequirementModel.create({
      id: `hiring_${Date.now()}`,
      boutiqueId: req.user.id,
      title: req.body.title,
      skills: req.body.skills || [],
      experience: req.body.experience,
      employmentType: req.body.employmentType,
      salaryRange: req.body.salaryRange,
      location: req.body.location,
      vacancies: req.body.vacancies,
      closingDate: req.body.closingDate
    });
    res.status(201).json(newReq.get({ plain: true }));
  } catch (err) {
    console.error('Create hiring error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/hiring/:id', authenticateToken, requireBoutique, async (req: any, res) => {
  try {
    const reqPost = await RequirementModel.findByPk(req.params.id);
    if (!reqPost) return res.status(404).json({ message: 'Hiring post not found' });

    if (reqPost.boutiqueId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this resource.' });
    }

    await reqPost.destroy();
    res.status(200).json({ message: 'Hiring posting deleted' });
  } catch (err) {
    console.error('Delete hiring error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Notification center ---
router.get('/notifications', authenticateToken, async (req: any, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'))));
    const { count, rows: notifications } = await NotificationModel.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });
    return res.status(200).json({
      success: true,
      data: notifications.map(n => n.get({ plain: true })),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit), hasMore: page * limit < count },
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/notifications/:id/read', authenticateToken, async (req: any, res) => {
  try {
    await NotificationModel.update(
      { read: true },
      { where: { id: req.params.id, userId: req.user.id } }
    );
    res.status(200).json({ message: 'Notification marked read' });
  } catch (err) {
    console.error('Read notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/notifications/read-all', authenticateToken, async (req: any, res) => {
  try {
    await NotificationModel.update(
      { read: true },
      { where: { userId: req.user.id } }
    );
    res.status(200).json({ message: 'All notifications marked read' });
  } catch (err) {
    console.error('Read all notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/notifications/:id', authenticateToken, async (req: any, res) => {
  try {
    await NotificationModel.destroy({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.status(200).json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= PUBLIC BOUTIQUE LOOKUPS =================

router.get('/public', async (req, res) => {
  try {
    const profiles = await BoutiqueProfileModel.findAll();
    res.status(200).json(profiles.map(p => p.get({ plain: true })));
  } catch (err) {
    console.error('Public boutique profiles error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await BoutiqueProfileModel.findByPk(id);
    if (!profile) return res.status(404).json({ message: 'Boutique not found' });

    const tailors = await TailorModel.findAll({ where: { boutiqueId: id } });
    const portfolio = await PortfolioModel.findAll({ where: { boutiqueId: id } });
    
    const products = await ProductModel.findAll({
      where: {
        brand: {
          [isPostgres ? Op.iLike : Op.like]: profile.boutiqueName
        }
      }
    });

    res.status(200).json({
      profile: profile.get({ plain: true }),
      tailors: tailors.map(t => t.get({ plain: true })),
      portfolio: portfolio.map(p => p.get({ plain: true })),
      products: products.map(p => p.get({ plain: true }))
    });
  } catch (err) {
    console.error('Public boutique details error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
