import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { AppError } from './errorHandler';
import { ErrorCodes } from '../types';

// Configure Helmet with strict security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

// Input sanitization middleware
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized potentially malicious input in ${key}`);
  },
});

// File upload validation
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
};

const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024, // 10MB
  audio: 50 * 1024 * 1024, // 50MB
};

export function validateFileUpload(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return next();
  }

  const file = req.file;
  const fileType = file.mimetype.startsWith('image/') ? 'image' : 'audio';

  // Check file type
  const allowedTypes = ALLOWED_FILE_TYPES[fileType];
  if (!allowedTypes.includes(file.mimetype)) {
    return next(new AppError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      400,
      ErrorCodes.VALIDATION_ERROR
    ));
  }

  // Check file size
  const maxSize = MAX_FILE_SIZE[fileType];
  if (file.size > maxSize) {
    return next(new AppError(
      `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
      400,
      ErrorCodes.VALIDATION_ERROR
    ));
  }

  // Check file extension matches MIME type
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  const expectedExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'audio/mpeg': ['mp3'],
    'audio/wav': ['wav'],
    'audio/ogg': ['ogg'],
    'audio/mp4': ['m4a', 'mp4'],
  };

  const validExtensions = expectedExtensions[file.mimetype];
  if (!extension || !validExtensions?.includes(extension)) {
    return next(new AppError(
      'File extension does not match file type',
      400,
      ErrorCodes.VALIDATION_ERROR
    ));
  }

  next();
}

// Password strength validation
export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty123',
    'admin123', 'letmein', 'welcome123', 'monkey123'
  ];

  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common, please choose a stronger password');
  }

  return errors;
}

// SQL injection protection (additional layer on top of Prisma)
export function sqlInjectionProtection(req: Request, res: Response, next: NextFunction) {
  const suspiciousPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|where|table)\b)/i,
    /(;|'|--|\/\*|\*\/|xp_|sp_)/i,
    /(\b(script|javascript|vbscript|onload|onerror|onclick)\b)/i,
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    console.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    
    return next(new AppError(
      'Invalid input detected',
      400,
      ErrorCodes.VALIDATION_ERROR
    ));
  }

  next();
}

// CSRF protection token generation
export function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Additional security headers not covered by Helmet
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove fingerprinting headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
}