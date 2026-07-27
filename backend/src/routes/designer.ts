import { Router, Response } from 'express';
import { 
  DesignerProfile as DesignerModel,
  CustomizationRequest as CustomizationModel 
} from '../db/models';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { designerProfileSchema, customizationRequestSchema } from '../validators/schemas';

const router = Router();

// Middleware to verify active user is a registered designer or administrator
const requireDesigner = (req: any, res: Response, next: any) => {
  if (req.user.role !== 'designer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Designer role required.' });
  }
  next();
};

// Retrieve profile
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    let profile = await DesignerModel.findByPk(req.user.id);
    if (!profile) {
      profile = await DesignerModel.create({
        userId: req.user.id,
        designerName: req.user.name || 'My Label',
        portfolioImages: [],
        exclusiveCollections: [],
        about: 'Haute couture collections.',
        verified: false,
        customizationTerms: 'Custom size adjustments upon request.'
      });
    }
    res.status(200).json(profile.get({ plain: true }));
  } catch (err) {
    console.error('Get designer profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile with atomic transaction & auto-verification
router.put('/profile', authenticateToken, requireDesigner, validateBody(designerProfileSchema), async (req: any, res) => {
  try {
    const profile = await DesignerModel.findByPk(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Designer profile not found', errorCode: 4040 });
    }

    const allowed = ['designerName', 'portfolioImages', 'exclusiveCollections', 'about', 'customizationTerms'];
    const sanitized = Object.keys(req.body)
      .filter(key => allowed.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const portfolioImgs = Array.isArray(sanitized.portfolioImages) ? sanitized.portfolioImages : (profile.portfolioImages || []);
    const collections = Array.isArray(sanitized.exclusiveCollections) ? sanitized.exclusiveCollections : (profile.exclusiveCollections || []);
    const aboutText = sanitized.about !== undefined ? sanitized.about : (profile.about || '');

    // Auto-verification criteria: Name + (portfolio images OR collections OR about text >= 10 chars)
    const isEligibleForVerification = (
      Boolean(sanitized.designerName || profile.designerName) &&
      (portfolioImgs.length > 0 || collections.length > 0 || aboutText.length >= 10)
    );

    const updatedVerifiedStatus = profile.verified || isEligibleForVerification;

    await profile.update({
      ...sanitized,
      userId: req.user.id, // Immutable
      verified: updatedVerifiedStatus
    });

    return res.status(200).json({
      success: true,
      data: profile.get({ plain: true })
    });
  } catch (err) {
    console.error('Update designer profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating designer profile', errorCode: 5000 });
  }
});

// Customizations requests
router.get('/customizations', authenticateToken, requireDesigner, async (req: any, res) => {
  try {
    const requests = await CustomizationModel.findAll({ 
      where: { designerId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(requests.map(r => r.get({ plain: true })));
  } catch (err) {
    console.error('Get customization requests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/customizations/:id', authenticateToken, requireDesigner, async (req: any, res) => {
  try {
    const { status, reply } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const request = await CustomizationModel.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    if (request.designerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this resource.' });
    }

    await request.update({
      status,
      reply: reply || request.reply
    });

    res.status(200).json(request.get({ plain: true }));
  } catch (err) {
    console.error('Update customization status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit customization request
router.post('/:designerId/customize', authenticateToken, validateBody(customizationRequestSchema), async (req: any, res) => {
  try {
    const { designerId } = req.params;
    const { description, referenceImage } = req.body;

    const newRequest = await CustomizationModel.create({
      id: `cust_${Date.now()}`,
      designerId,
      customerId: req.user.id,
      customerName: req.user.name || 'Anonymous Customer',
      description,
      referenceImage,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    res.status(201).json(newRequest.get({ plain: true }));
  } catch (err) {
    console.error('Submit customization error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public designers list
router.get('/public', async (req, res) => {
  try {
    const profiles = await DesignerModel.findAll();
    res.status(200).json(profiles.map(p => p.get({ plain: true })));
  } catch (err) {
    console.error('Public designers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
