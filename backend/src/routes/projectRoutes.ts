import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import { Validator } from '../utils/validation';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new project
router.post(
  '/',
  Validator.validateRequest(Validator.validateProject.create),
  asyncHandler(projectController.create)
);

// Get all projects for the authenticated user
router.get('/', asyncHandler(projectController.findAll));

// Get a specific project
router.get('/:id', asyncHandler(projectController.findById));

// Update a project
router.put(
  '/:id',
  Validator.validateRequest(Validator.validateProject.update),
  asyncHandler(projectController.update)
);

// Delete a project
router.delete('/:id', asyncHandler(projectController.delete));

// Duplicate a project
router.post('/:id/duplicate', asyncHandler(projectController.duplicate));

// Add asset to project
router.post(
  '/:id/assets',
  Validator.validateRequest(Validator.validateProject.addAsset),
  asyncHandler(projectController.addAsset)
);

// Get project assets
router.get('/:id/assets', asyncHandler(projectController.getAssets));

// Remove asset from project
router.delete('/:id/assets/:assetId', asyncHandler(projectController.removeAsset));

export default router;