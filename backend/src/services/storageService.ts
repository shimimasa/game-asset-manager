import { v4 as uuidv4 } from 'uuid';
import { s3Service } from '../config/s3';
import { fileProcessor } from '../utils/fileProcessing';
import { getFileType } from '../config/multer';
import { AppError } from '../middleware/errorHandler';
import { ErrorCodes } from '../types';

export interface UploadResult {
  fileUrl: string;
  thumbnailUrl?: string;
  metadata: Record<string, any>;
  fileType: 'IMAGE' | 'AUDIO';
  fileSize: number;
}

export class StorageService {
  /**
   * Upload image with thumbnail generation
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string
  ): Promise<UploadResult> {
    try {
      // Process image and generate thumbnail
      const { thumbnail, metadata } = await fileProcessor.processImage(file.buffer);

      // Generate unique keys
      const imageKey = s3Service.generateFileKey(userId, file.originalname, 'images');
      const thumbnailKey = s3Service.generateFileKey(
        userId,
        `thumb_${file.originalname}`,
        'thumbnails'
      );

      // Upload original image and thumbnail
      const [imageUrl, thumbnailUrl] = await Promise.all([
        s3Service.uploadFile(imageKey, file.buffer, file.mimetype, {
          originalName: file.originalname,
          userId,
        }),
        s3Service.uploadFile(thumbnailKey, thumbnail, 'image/jpeg', {
          originalName: file.originalname,
          userId,
          type: 'thumbnail',
        }),
      ]);

      return {
        fileUrl: imageUrl,
        thumbnailUrl,
        metadata,
        fileType: 'IMAGE',
        fileSize: file.size,
      };
    } catch (error) {
      console.error('Image upload error:', error);
      throw new AppError('Failed to upload image', 500, ErrorCodes.UPLOAD_FAILED);
    }
  }

  /**
   * Upload audio file
   */
  async uploadAudio(
    file: Express.Multer.File,
    userId: string
  ): Promise<UploadResult> {
    try {
      // Get audio metadata
      const metadata = await fileProcessor.getAudioMetadata(file.buffer);
      
      // Generate waveform data
      const waveform = await fileProcessor.generateWaveform(file.buffer);
      metadata['waveform'] = waveform;

      // Generate unique key
      const audioKey = s3Service.generateFileKey(userId, file.originalname, 'audio');

      // Upload audio file
      const audioUrl = await s3Service.uploadFile(audioKey, file.buffer, file.mimetype, {
        originalName: file.originalname,
        userId,
      });

      return {
        fileUrl: audioUrl,
        metadata,
        fileType: 'AUDIO',
        fileSize: file.size,
      };
    } catch (error) {
      console.error('Audio upload error:', error);
      throw new AppError('Failed to upload audio', 500, ErrorCodes.UPLOAD_FAILED);
    }
  }

  /**
   * Upload file (auto-detect type)
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string
  ): Promise<UploadResult> {
    // Validate file
    const fileType = getFileType(file.mimetype);
    if (!fileType) {
      throw new AppError('Invalid file type', 400, ErrorCodes.INVALID_FILE_TYPE);
    }

    // Upload based on file type
    if (fileType === 'IMAGE') {
      return this.uploadImage(file, userId);
    } else {
      return this.uploadAudio(file, userId);
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileUrl: string, thumbnailUrl?: string): Promise<void> {
    try {
      // Extract key from URL
      const fileKey = this.extractKeyFromUrl(fileUrl);
      
      const deletePromises = [s3Service.deleteFile(fileKey)];
      
      if (thumbnailUrl) {
        const thumbnailKey = this.extractKeyFromUrl(thumbnailUrl);
        deletePromises.push(s3Service.deleteFile(thumbnailKey));
      }

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('File deletion error:', error);
      throw new AppError('Failed to delete file', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get presigned URL for direct upload
   */
  async getUploadUrl(
    filename: string,
    mimeType: string,
    userId: string
  ): Promise<{ uploadUrl: string; fileKey: string }> {
    const fileType = getFileType(mimeType);
    if (!fileType) {
      throw new AppError('Invalid file type', 400, ErrorCodes.INVALID_FILE_TYPE);
    }

    const folder = fileType === 'IMAGE' ? 'images' : 'audio';
    const fileKey = s3Service.generateFileKey(userId, filename, folder);
    const uploadUrl = await s3Service.getUploadUrl(fileKey, mimeType);

    return { uploadUrl, fileKey };
  }

  /**
   * Get presigned URL for download
   */
  async getDownloadUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    const fileKey = this.extractKeyFromUrl(fileUrl);
    return s3Service.getDownloadUrl(fileKey, expiresIn);
  }

  /**
   * Extract S3 key from URL
   */
  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    } catch (error) {
      // If not a valid URL, assume it's already a key
      return url;
    }
  }

  /**
   * Upload file from local path
   */
  async uploadFromPath(filePath: string, s3Key: string): Promise<string> {
    const fs = require('fs');
    const fileContent = fs.readFileSync(filePath);
    const mimeType = require('mime-types').lookup(filePath) || 'application/octet-stream';
    
    return s3Service.uploadFile(s3Key, fileContent, mimeType);
  }

  /**
   * Download file to local path
   */
  async downloadToPath(fileUrl: string, outputPath: string): Promise<void> {
    const key = s3Service.getKeyFromUrl(fileUrl);
    const fileContent = await s3Service.getFile(key);
    const fs = require('fs');
    fs.writeFileSync(outputPath, fileContent);
  }

  /**
   * Delete file by URL
   */
  async deleteFile(fileUrl: string): Promise<void> {
    const key = s3Service.getKeyFromUrl(fileUrl);
    await s3Service.deleteFile(key);
  }
}

export const storageService = new StorageService();