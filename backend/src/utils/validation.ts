import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { ErrorCodes } from '../types';

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export class Validator {
  static validatePrompt = {
    create: [
      { field: 'title', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
      { field: 'content', required: true, type: 'string' as const, minLength: 1, maxLength: 5000 },
      { field: 'type', required: true, type: 'string' as const, custom: (value: any) => {
        return ['IMAGE', 'AUDIO'].includes(value) || 'type must be IMAGE or AUDIO';
      }},
      { field: 'parameters', required: false, type: 'object' as const },
    ],
    update: [
      { field: 'title', required: false, type: 'string' as const, minLength: 1, maxLength: 100 },
      { field: 'content', required: false, type: 'string' as const, minLength: 1, maxLength: 5000 },
      { field: 'parameters', required: false, type: 'object' as const },
    ],
  };

  static validateProject = {
    create: [
      { field: 'name', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
      { field: 'description', required: false, type: 'string' as const, maxLength: 500 },
    ],
    update: [
      { field: 'name', required: false, type: 'string' as const, minLength: 1, maxLength: 100 },
      { field: 'description', required: false, type: 'string' as const, maxLength: 500 },
    ],
    addAsset: [
      { field: 'assetId', required: true, type: 'string' as const },
    ],
  };

  static validateExport = {
    project: [
      { field: 'options', required: false, type: 'object' as const },
      { field: 'options.imageFormat', required: false, type: 'string' as const, custom: (value: any) => {
        return !value || ['jpg', 'png', 'webp'].includes(value) || 'imageFormat must be jpg, png, or webp';
      }},
      { field: 'options.audioFormat', required: false, type: 'string' as const, custom: (value: any) => {
        return !value || ['mp3', 'wav', 'ogg'].includes(value) || 'audioFormat must be mp3, wav, or ogg';
      }},
      { field: 'options.includeMetadata', required: false, type: 'boolean' as const },
      { field: 'options.skipErrors', required: false, type: 'boolean' as const },
    ],
    assets: [
      { field: 'assetIds', required: true, type: 'array' as const, minLength: 1 },
      { field: 'options', required: false, type: 'object' as const },
    ],
  };

  static validateRequest(rules: ValidationRule[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors: string[] = [];

      for (const rule of rules) {
        const value = req.body[rule.field];

        // Check required
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(`${rule.field} is required`);
          continue;
        }

        // Skip validation if field is not required and not provided
        if (!rule.required && (value === undefined || value === null)) {
          continue;
        }

        // Type validation
        if (rule.type) {
          switch (rule.type) {
            case 'string':
              if (typeof value !== 'string') {
                errors.push(`${rule.field} must be a string`);
              }
              break;
            case 'number':
              if (typeof value !== 'number' && isNaN(Number(value))) {
                errors.push(`${rule.field} must be a number`);
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean') {
                errors.push(`${rule.field} must be a boolean`);
              }
              break;
            case 'email':
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                errors.push(`${rule.field} must be a valid email`);
              }
              break;
            case 'array':
              if (!Array.isArray(value)) {
                errors.push(`${rule.field} must be an array`);
              }
              break;
          }
        }

        // String length validation
        if (typeof value === 'string') {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
          }
        }

        // Number range validation
        if (typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`${rule.field} must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(`${rule.field} must be at most ${rule.max}`);
          }
        }

        // Pattern validation
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
        }

        // Custom validation
        if (rule.custom) {
          const result = rule.custom(value);
          if (result !== true) {
            errors.push(typeof result === 'string' ? result : `${rule.field} is invalid`);
          }
        }
      }

      if (errors.length > 0) {
        next(
          new AppError(
            'Validation failed',
            400,
            ErrorCodes.VALIDATION_ERROR,
            { errors }
          )
        );
      } else {
        next();
      }
    };
  }

  static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
  }

  static isValidUsername(username: string): boolean {
    // Username: 3-20 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  static isValidPassword(password: string): boolean {
    // Password: at least 8 characters, must contain at least one letter and one number
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  }
}