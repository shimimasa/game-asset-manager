import { Router } from 'express';
import { assetController } from '../controllers/assetController';
import { authenticate } from '../middleware/auth';
import { handleSingleUpload, validateFileMetadata } from '../middleware/upload';
import { Validator } from '../utils/validation';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { validateFileUpload } from '../middleware/security';

const router = Router();

// All asset routes require authentication
router.use(authenticate);

// Validation rules
const updateAssetValidation = Validator.validateRequest([
  { field: 'tags', required: false, type: 'array' },
  { field: 'category', required: false, type: 'string' },
]);

const uploadUrlValidation = Validator.validateRequest([
  { field: 'filename', required: true, type: 'string' },
  { field: 'mimeType', required: true, type: 'string' },
]);

// Routes
router.post(
  '/upload',
  uploadRateLimiter,
  handleSingleUpload('file'),
  validateFileUpload,
  validateFileMetadata,
  assetController.uploadAsset
);

router.get('/', assetController.getAssets);
router.get('/:id', assetController.getAsset);
router.put('/:id', updateAssetValidation, assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

// Get presigned upload URL for direct upload
router.post('/upload-url', uploadUrlValidation, assetController.getUploadUrl);

export default router;