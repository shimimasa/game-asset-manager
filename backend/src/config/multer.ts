import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../middleware/errorHandler';
import { ErrorCodes } from '../types';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      400,
      ErrorCodes.INVALID_FILE_TYPE
    ));
  }
};

// Multer configuration for memory storage
const multerConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Single file upload middleware
export const uploadSingle = multerConfig.single('file');

// Multiple files upload middleware
export const uploadMultiple = multerConfig.array('files', 10); // Max 10 files

// File type helpers
export const isImageFile = (mimeType: string): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
};

export const isAudioFile = (mimeType: string): boolean => {
  return ALLOWED_AUDIO_TYPES.includes(mimeType);
};

// Get file type from mime type
export const getFileType = (mimeType: string): 'IMAGE' | 'AUDIO' | null => {
  if (isImageFile(mimeType)) return 'IMAGE';
  if (isAudioFile(mimeType)) return 'AUDIO';
  return null;
};