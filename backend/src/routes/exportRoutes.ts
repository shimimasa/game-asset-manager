import { Router } from 'express';
import { exportController } from '../controllers/exportController';
import { authenticate } from '../middleware/auth';
import { Validator } from '../utils/validation';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Export project
router.post(
  '/projects/:id',
  Validator.validateRequest(Validator.validateExport.project),
  asyncHandler(exportController.exportProject)
);

// Export assets
router.post(
  '/assets',
  Validator.validateRequest(Validator.validateExport.assets),
  asyncHandler(exportController.exportAssets)
);

// Get export status
router.get('/:exportId', asyncHandler(exportController.getExportStatus));

export default router;