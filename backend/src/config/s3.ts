import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../middleware/errorHandler';
import { ErrorCodes } from '../types';

// S3クライアントの設定
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export class S3Service {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || '';
    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      });

      await s3Client.send(command);
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new AppError('Failed to upload file', 500, ErrorCodes.UPLOAD_FAILED);
    }
  }

  /**
   * Get presigned URL for direct upload
   */
  async getUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      throw new AppError('Failed to generate upload URL', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get presigned URL for download
   */
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('S3 download URL error:', error);
      throw new AppError('Failed to generate download URL', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new AppError('Failed to delete file', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate unique file key
   */
  generateFileKey(userId: string, filename: string, folder: string = 'assets'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${folder}/${userId}/${timestamp}_${randomString}_${sanitizedFilename}`;
  }
}

export const s3Service = new S3Service();