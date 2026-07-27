import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import db from '../db/dbStore';
import { register, login, googleLogin, getProfile } from '../controllers/authController';
import { getProducts, getProductById, getCategoriesAndBrands, addProductReview } from '../controllers/productController';
import { getCart, updateCart, getWishlist, toggleWishlist } from '../controllers/cartController';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  applyCoupon,
  getOrders,
  getOrderById,
  createOrder,
  downloadInvoice,
  updateOrderStatus
} from '../controllers/orderController';
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
import {
  getPersonalizedRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getSmartSearchSuggestions
} from '../controllers/aiController';
import { authenticateToken, optionalAuthenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleLogin);
router.get('/auth/profile', authenticateToken, getProfile);

// --- Product Routes ---
router.get('/products', getProducts);
router.get('/products/meta', getCategoriesAndBrands);
router.get('/products/:id', getProductById);
router.post('/products/:id/review', authenticateToken, addProductReview);

// --- Cart & Wishlist Routes ---
router.get('/cart', authenticateToken, getCart);
router.post('/cart', authenticateToken, updateCart);
router.get('/wishlist', authenticateToken, getWishlist);
router.post('/wishlist/toggle', authenticateToken, toggleWishlist);

// --- Order & Checkout Routes ---
router.get('/addresses', authenticateToken, getAddresses);
router.post('/addresses', authenticateToken, addAddress);
router.put('/addresses/:id', authenticateToken, updateAddress);
router.delete('/addresses/:id', authenticateToken, deleteAddress);
router.post('/coupons/apply', authenticateToken, applyCoupon);
router.get('/orders', authenticateToken, getOrders);
router.get('/orders/:id', authenticateToken, getOrderById);
router.post('/orders', authenticateToken, createOrder);
router.get('/orders/:id/invoice', authenticateToken, downloadInvoice);

// --- AI Recommendation Routes ---
router.get('/ai/personalized', optionalAuthenticateToken, getPersonalizedRecommendations);
router.get('/ai/similar/:id', getSimilarProducts);
router.get('/ai/bundle/:id', getFrequentlyBoughtTogether);
router.get('/ai/search-suggestions', getSmartSearchSuggestions);

// --- Admin Routes ---
router.get('/admin/stats', authenticateToken, requireAdmin, getDashboardStats);
router.post('/admin/products', authenticateToken, requireAdmin, createProduct);
router.put('/admin/products/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/admin/products/:id', authenticateToken, requireAdmin, deleteProduct);
router.get('/admin/orders', authenticateToken, requireAdmin, getAllOrders);
router.put('/admin/orders/:id/status', authenticateToken, requireAdmin, updateOrderStatus);
router.get('/admin/coupons', authenticateToken, requireAdmin, getAllCoupons);
router.post('/admin/coupons', authenticateToken, requireAdmin, createCoupon);
router.delete('/admin/coupons/:code', authenticateToken, requireAdmin, deleteCoupon);

// ================= BOUTIQUE ROUTES =================

// Get boutique profile
router.get('/boutique/profile', authenticateToken, (req: any, res) => {
  const profiles = db.getBoutiqueProfiles();
  let profile = profiles.find(p => p.userId === req.user.id);
  if (!profile) {
    profile = {
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
    };
    profiles.push(profile);
    db.saveBoutiqueProfiles(profiles);
  }
  res.status(200).json(profile);
});

// Update boutique profile
router.put('/boutique/profile', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'boutique' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const profiles = db.getBoutiqueProfiles();
  const idx = profiles.findIndex(p => p.userId === req.user.id);
  const updatedProfile = {
    ...profiles[idx],
    ...req.body,
    userId: req.user.id,
    verified: profiles[idx]?.verified || false
  };
  if (idx > -1) {
    profiles[idx] = updatedProfile;
  } else {
    profiles.push(updatedProfile);
  }
  db.saveBoutiqueProfiles(profiles);
  res.status(200).json(updatedProfile);
});

// Get boutique orders
router.get('/boutique/orders', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'boutique' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const orders = db.getOrders();
  res.status(200).json(orders);
});

// Update boutique order status
router.put('/boutique/orders/:id/status', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'boutique' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { status } = req.body;
  const orders = db.getOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.orderStatus = status;
  db.saveOrders(orders);
  res.status(200).json(order);
});

// ================= BOUTIQUE SELLER PORTAL ENHANCEMENTS =================

// --- Tailor team routes ---
router.get('/boutique/tailors', authenticateToken, (req: any, res) => {
  const tailors = db.getTailors().filter(t => t.boutiqueId === req.user.id);
  res.status(200).json(tailors);
});

router.post('/boutique/tailors', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'boutique') return res.status(403).json({ message: 'Forbidden' });
  const tailors = db.getTailors();
  const newTailor = {
    id: `tailor_${Date.now()}`,
    boutiqueId: req.user.id,
    name: req.body.name,
    photoUrl: req.body.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    experience: req.body.experience || '3 Years',
    specialization: req.body.specialization || 'Embroidery',
    certifications: req.body.certifications || [],
    workingHours: req.body.workingHours || '09:00 AM - 06:00 PM',
    languages: req.body.languages || ['English', 'Hindi'],
    bio: req.body.bio || '',
    rating: 5,
    projectsCount: Number(req.body.projectsCount) || 0
  };
  tailors.push(newTailor);
  db.saveTailors(tailors);
  res.status(201).json(newTailor);
});

router.delete('/boutique/tailors/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'boutique') return res.status(403).json({ message: 'Forbidden' });
  let tailors = db.getTailors();
  tailors = tailors.filter(t => !(t.id === req.params.id && t.boutiqueId === req.user.id));
  db.saveTailors(tailors);
  res.status(200).json({ message: 'Tailor deleted successfully' });
});

// --- Portfolio lookbook routes ---
router.get('/boutique/portfolio', authenticateToken, (req: any, res) => {
  const portfolios = db.getPortfolios().filter(p => p.boutiqueId === req.user.id);
  res.status(200).json(portfolios);
});

router.post('/boutique/portfolio', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'boutique') return res.status(403).json({ message: 'Forbidden' });
  const portfolios = db.getPortfolios();
  const newItem = {
    id: `port_${Date.now()}`,
    boutiqueId: req.user.id,
    images: req.body.images || ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'],
    designName: req.body.designName,
    category: req.body.category,
    description: req.body.description || '',
    fabric: req.body.fabric || 'Silk',
    stitchingType: req.body.stitchingType || 'Custom Fit',
    completionTime: req.body.completionTime || '3 Days',
    customerReview: req.body.customerReview || ''
  };
  portfolios.push(newItem);
  db.savePortfolios(portfolios);
  res.status(201).json(newItem);
});

router.delete('/boutique/portfolio/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'boutique') return res.status(403).json({ message: 'Forbidden' });
  let portfolios = db.getPortfolios();
  portfolios = portfolios.filter(p => !(p.id === req.params.id && p.boutiqueId === req.user.id));
  db.savePortfolios(portfolios);
  res.status(200).json({ message: 'Portfolio item deleted successfully' });
});

// --- Hiring desk routes ---
router.get('/boutique/hiring', authenticateToken, (req: any, res) => {
  const requirements = db.getTailorRequirements().filter(r => r.boutiqueId === req.user.id);
  res.status(200).json(requirements);
});

router.post('/boutique/hiring', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'boutique') return res.status(403).json({ message: 'Forbidden' });
  const requirements = db.getTailorRequirements();
  const newReq = {
    id: `hiring_${Date.now()}`,
    boutiqueId: req.user.id,
    title: req.body.title,
    skills: req.body.skills || [],
    experience: req.body.experience || '2 Years',
    employmentType: req.body.employmentType || 'Full-time',
    salaryRange: req.body.salaryRange || '20,000 - 30,000 INR',
    location: req.body.location || 'Mumbai',
    vacancies: Number(req.body.vacancies) || 1,
    closingDate: req.body.closingDate || '2026-12-31'
  };
  requirements.push(newReq);
  db.saveTailorRequirements(requirements);
  res.status(201).json(newReq);
});

router.delete('/boutique/hiring/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'boutique') return res.status(403).json({ message: 'Forbidden' });
  let requirements = db.getTailorRequirements();
  requirements = requirements.filter(r => !(r.id === req.params.id && r.boutiqueId === req.user.id));
  db.saveTailorRequirements(requirements);
  res.status(200).json({ message: 'Hiring posting deleted' });
});

// --- Notification center routes ---
router.get('/boutique/notifications', authenticateToken, (req: any, res) => {
  const notifications = db.getNotifications().filter(n => n.userId === req.user.id);
  res.status(200).json(notifications);
});

router.put('/boutique/notifications/:id/read', authenticateToken, (req: any, res) => {
  const notifications = db.getNotifications();
  const idx = notifications.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
  if (idx > -1) {
    notifications[idx].read = true;
    db.saveNotifications(notifications);
  }
  res.status(200).json({ message: 'Notification marked read' });
});

router.put('/boutique/notifications/read-all', authenticateToken, (req: any, res) => {
  const notifications = db.getNotifications();
  notifications.forEach(n => {
    if (n.userId === req.user.id) n.read = true;
  });
  db.saveNotifications(notifications);
  res.status(200).json({ message: 'All notifications marked read' });
});

router.delete('/boutique/notifications/:id', authenticateToken, (req: any, res) => {
  let notifications = db.getNotifications();
  notifications = notifications.filter(n => !(n.id === req.params.id && n.userId === req.user.id));
  db.saveNotifications(notifications);
  res.status(200).json({ message: 'Notification deleted' });
});

// --- Public Boutique storefront lookups ---
router.get('/public/boutiques', (req, res) => {
  const profiles = db.getBoutiqueProfiles();
  res.status(200).json(profiles);
});

router.get('/public/boutiques/:id', (req, res) => {
  const { id } = req.params;
  const profiles = db.getBoutiqueProfiles();
  const profile = profiles.find(p => p.userId === id);
  if (!profile) return res.status(404).json({ message: 'Boutique not found' });

  // Get matching tailors
  const tailors = db.getTailors().filter(t => t.boutiqueId === id);
  // Get matching portfolio
  const portfolio = db.getPortfolios().filter(p => p.boutiqueId === id);
  // Get matching products
  const products = db.getProducts().filter(p => p.brand.toLowerCase() === profile.boutiqueName.toLowerCase());

  res.status(200).json({
    profile,
    tailors,
    portfolio,
    products
  });
});

// ================= DESIGNER ROUTES =================

// Get designer profile
router.get('/designer/profile', authenticateToken, (req: any, res) => {
  const profiles = db.getDesignerProfiles();
  let profile = profiles.find(p => p.userId === req.user.id);
  if (!profile) {
    profile = {
      userId: req.user.id,
      designerName: req.user.name || 'My Label',
      portfolioImages: [],
      exclusiveCollections: [],
      about: 'Haute couture collections.',
      verified: false,
      customizationTerms: 'Custom size adjustments upon request.'
    };
    profiles.push(profile);
    db.saveDesignerProfiles(profiles);
  }
  res.status(200).json(profile);
});

// Update designer profile
router.put('/designer/profile', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'designer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const profiles = db.getDesignerProfiles();
  const idx = profiles.findIndex(p => p.userId === req.user.id);
  const updatedProfile = {
    ...profiles[idx],
    ...req.body,
    userId: req.user.id,
    verified: profiles[idx]?.verified || false
  };
  if (idx > -1) {
    profiles[idx] = updatedProfile;
  } else {
    profiles.push(updatedProfile);
  }
  db.saveDesignerProfiles(profiles);
  res.status(200).json(updatedProfile);
});

// Get designer customizations requests
router.get('/designer/customizations', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'designer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const requests = db.getCustomizationRequests();
  const designerRequests = requests.filter(r => r.designerId === req.user.id);
  res.status(200).json(designerRequests);
});

// Update designer customization status
router.put('/designer/customizations/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'designer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { status, reply } = req.body;
  const requests = db.getCustomizationRequests();
  const reqIdx = requests.findIndex(r => r.id === req.params.id);
  if (reqIdx === -1) return res.status(404).json({ message: 'Request not found' });
  requests[reqIdx] = {
    ...requests[reqIdx],
    status,
    reply: reply || requests[reqIdx].reply
  };
  db.saveCustomizationRequests(requests);
  res.status(200).json(requests[reqIdx]);
});

// Submit customization request
router.post('/designer/:designerId/customize', authenticateToken, (req: any, res) => {
  const { designerId } = req.params;
  const { description, referenceImage } = req.body;
  if (!description) return res.status(400).json({ message: 'Description is required' });

  const requests = db.getCustomizationRequests();
  const newRequest = {
    id: `cust_${Date.now()}`,
    designerId,
    customerId: req.user.id,
    customerName: req.user.name || 'Anonymous Customer',
    description,
    referenceImage,
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };
  requests.push(newRequest);
  db.saveCustomizationRequests(requests);
  res.status(201).json(newRequest);
});

// Get public designers list
router.get('/public/designers', (req, res) => {
  const profiles = db.getDesignerProfiles();
  res.status(200).json(profiles);
});

// ================= ADMIN ADDITIONS =================

// Admin gets all users with profiles
router.get('/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.getUsers();
  const boutiques = db.getBoutiqueProfiles();
  const designers = db.getDesignerProfiles();

  const formattedUsers = users.map(u => {
    let detail: any = {};
    let verified = true;
    if (u.role === 'boutique') {
      detail = boutiques.find(b => b.userId === u.id) || {};
      verified = detail.verified ?? false;
    } else if (u.role === 'designer') {
      detail = designers.find(d => d.userId === u.id) || {};
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
});

// Admin verify user
router.put('/admin/users/:id/verify', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { verified } = req.body;

  const users = db.getUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.role === 'boutique') {
    const boutiques = db.getBoutiqueProfiles();
    const idx = boutiques.findIndex(b => b.userId === id);
    if (idx > -1) {
      boutiques[idx].verified = verified;
      db.saveBoutiqueProfiles(boutiques);
    }
  } else if (user.role === 'designer') {
    const designers = db.getDesignerProfiles();
    const idx = designers.findIndex(d => d.userId === id);
    if (idx > -1) {
      designers[idx].verified = verified;
      db.saveDesignerProfiles(designers);
    }
  }
  res.status(200).json({ message: `Verification status updated for user ${id}`, verified });
});

// Configure Cloudinary (trim values to strip any \r\n artifacts from env injection)
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
});

// Use memory storage — no disk writes (works on Vercel)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extMatch = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '');
    const mimeMatch = allowedTypes.test(file.mimetype);
    if (extMatch && mimeMatch) return cb(null, true);
    cb(new Error('Only images (jpg, jpeg, png, webp) are allowed'));
  }
});

// Upload image → Cloudinary
router.post('/upload', upload.single('file'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'clara-fashion', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file!.buffer);
    });
    res.status(200).json({ url: result.secure_url, public_id: result.public_id });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ message: 'Image upload failed', error: err.message });
  }
});

// Delete image from Cloudinary
router.delete('/upload', async (req, res) => {
  const { url, public_id } = req.body;
  if (!url && !public_id) return res.status(400).json({ message: 'URL or public_id required' });

  try {
    let pid = public_id;
    if (!pid && url) {
      // Extract public_id from Cloudinary URL
      // e.g. https://res.cloudinary.com/cloud/image/upload/v123/clara-fashion/filename.jpg
      const parts = url.split('/');
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split('.')[0];
      const folderIdx = parts.indexOf('clara-fashion');
      pid = folderIdx !== -1 ? `clara-fashion/${filename}` : filename;
    }
    await cloudinary.uploader.destroy(pid);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err: any) {
    console.error('Cloudinary delete error:', err);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

export default router;
