import { Router } from 'express';
import { promptController } from '../controllers/promptController';
import { authenticate } from '../middleware/auth';
import { Validator } from '../utils/validation';
import { asyncHandler } from '../middleware/asyncHandler';
import { generationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new prompt
router.post(
  '/',
  Validator.validateRequest(Validator.validatePrompt.create),
  asyncHandler(promptController.create)
);

// Get all prompts for the authenticated user
router.get('/', asyncHandler(promptController.findAll));

// Get a specific prompt
router.get('/:id', asyncHandler(promptController.findById));

// Update a prompt
router.put(
  '/:id',
  Validator.validateRequest(Validator.validatePrompt.update),
  asyncHandler(promptController.update)
);

// Delete a prompt
router.delete('/:id', asyncHandler(promptController.delete));

// Clone a prompt
router.post('/:id/clone', asyncHandler(promptController.clone));

// Execute a prompt (with rate limiting)
router.post('/:id/execute', generationRateLimiter, asyncHandler(promptController.execute));

// Get all executions
router.get('/executions', asyncHandler(promptController.getExecutions));

// Get a specific execution
router.get('/executions/:executionId', asyncHandler(promptController.getExecution));

// Cancel an execution
router.delete('/executions/:executionId', asyncHandler(promptController.cancelExecution));

export default router;