import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configure Cloudinary (trim to strip env artifact symbols)
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
});

// Configure Multer storage engine with strict security guards
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // Reduced from 50MB to 10MB for safety
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only accept JPEG, PNG, and WebP images
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;

    const mimeMatch = allowedMimeTypes.includes(file.mimetype);
    const extMatch = allowedExtensions.test(file.originalname.toLowerCase());

    if (mimeMatch && extMatch) {
      return cb(null, true);
    }
    
    cb(new Error('Invalid file type. Only JPG, PNG, and WebP images up to 10MB are allowed.'));
  }
});

// Get signed Cloudinary signature for direct browser uploading
router.get('/signature', authenticateToken, (req, res) => {
  try {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'clara-fashion'
    }, cloudinary.config().api_secret!);
    
    res.status(200).json({
      signature,
      timestamp,
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key,
      folder: 'clara-fashion'
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500).json({ message: 'Failed to generate upload signature' });
  }
});

// Upload image endpoint
router.post('/', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

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

// Delete image endpoint
router.delete('/', authenticateToken, async (req, res) => {
  const { url, public_id } = req.body;
  if (!url && !public_id) {
    return res.status(400).json({ message: 'URL or public_id parameter is required' });
  }

  try {
    let pid = public_id;
    if (!pid && url) {
      // Extract public_id from Cloudinary URL
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
