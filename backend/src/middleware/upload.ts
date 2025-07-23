import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadSingle, uploadMultiple } from '../config/multer';
import { AppError } from './errorHandler';
import { ErrorCodes } from '../types';

// Wrapper for single file upload with error handling
export const handleSingleUpload = (fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError(
              'File size too large',
              400,
              ErrorCodes.FILE_TOO_LARGE
            ));
          }
          return next(new AppError(
            `Upload error: ${err.message}`,
            400,
            ErrorCodes.UPLOAD_FAILED
          ));
        }
        return next(err);
      }

      if (!req.file) {
        return next(new AppError(
          'No file uploaded',
          400,
          ErrorCodes.VALIDATION_ERROR
        ));
      }

      next();
    });
  };
};

// Wrapper for multiple files upload with error handling
export const handleMultipleUpload = (fieldName: string = 'files', maxCount: number = 10) => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMultiple(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError(
              'File size too large',
              400,
              ErrorCodes.FILE_TOO_LARGE
            ));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError(
              `Too many files. Maximum ${maxCount} files allowed`,
              400,
              ErrorCodes.VALIDATION_ERROR
            ));
          }
          return next(new AppError(
            `Upload error: ${err.message}`,
            400,
            ErrorCodes.UPLOAD_FAILED
          ));
        }
        return next(err);
      }

      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        return next(new AppError(
          'No files uploaded',
          400,
          ErrorCodes.VALIDATION_ERROR
        ));
      }

      next();
    });
  };
};

// Validate uploaded file metadata
export const validateFileMetadata = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add any additional file validation here
    // For example: check file names, validate metadata, etc.
    
    if (req.file) {
      // Single file validation
      const file = req.file;
      
      // Sanitize filename
      file.originalname = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Add file info to request for easy access
      (req as any).fileInfo = {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    } else if (req.files && Array.isArray(req.files)) {
      // Multiple files validation
      req.files.forEach(file => {
        file.originalname = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      });
      
      (req as any).filesInfo = req.files.map(file => ({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      }));
    }

    next();
  } catch (error) {
    next(new AppError(
      'File validation failed',
      400,
      ErrorCodes.VALIDATION_ERROR
    ));
  }
};