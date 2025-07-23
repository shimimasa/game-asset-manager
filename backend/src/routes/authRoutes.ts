import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { Validator } from '../utils/validation';
import { authRateLimiter, loginBruteForceProtection } from '../middleware/rateLimiter';

const router = Router();

// Validation rules
const registerValidation = Validator.validateRequest([
  { field: 'email', required: true, type: 'email' },
  {
    field: 'username',
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 20,
    custom: (value) => Validator.isValidUsername(value) || 'Username must be alphanumeric with underscores only',
  },
  {
    field: 'password',
    required: true,
    type: 'string',
    minLength: 8,
    custom: (value) => Validator.isValidPassword(value) || 'Password must contain at least one letter and one number',
  },
]);

const loginValidation = Validator.validateRequest([
  { field: 'email', required: true, type: 'email' },
  { field: 'password', required: true, type: 'string' },
]);

const refreshTokenValidation = Validator.validateRequest([
  { field: 'refreshToken', required: true, type: 'string' },
]);

// Routes with rate limiting
router.post('/register', authRateLimiter, registerValidation, authController.register);
router.post('/login', authRateLimiter, loginBruteForceProtection, loginValidation, authController.login);
router.post('/refresh', authRateLimiter, refreshTokenValidation, authController.refreshToken);
router.get('/profile', authenticate, authController.getProfile);
router.post('/logout', authController.logout);

export default router;