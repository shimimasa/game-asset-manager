import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { exec } from 'child_process';
import { writeFile } from 'fs/promises';
import { AppError } from '../middleware/errorHandler';
import { ErrorCodes, ExportFormat } from '../types';

const execAsync = promisify(exec);

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha?: boolean;
}

export interface AudioMetadata {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
}

export class FileProcessor {
  /**
   * Process image and generate thumbnail
   */
  async processImage(buffer: Buffer): Promise<{
    thumbnail: Buffer;
    metadata: ImageMetadata;
  }> {
    try {
      // Get image metadata
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image metadata');
      }

      const imageMetadata: ImageMetadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'unknown',
        size: buffer.length,
        hasAlpha: metadata.hasAlpha,
      };

      // Generate thumbnail (max 300x300, maintaining aspect ratio)
      const thumbnail = await image
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return {
        thumbnail,
        metadata: imageMetadata,
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new AppError('Failed to process image', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Optimize image for web
   */
  async optimizeImage(buffer: Buffer, format: 'jpeg' | 'png' | 'webp' = 'webp'): Promise<Buffer> {
    try {
      const image = sharp(buffer);

      switch (format) {
        case 'jpeg':
          return await image.jpeg({ quality: 85, progressive: true }).toBuffer();
        case 'png':
          return await image.png({ compressionLevel: 9 }).toBuffer();
        case 'webp':
          return await image.webp({ quality: 85 }).toBuffer();
        default:
          return buffer;
      }
    } catch (error) {
      console.error('Image optimization error:', error);
      throw new AppError('Failed to optimize image', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get audio metadata using ffprobe
   */
  async getAudioMetadata(buffer: Buffer): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      // Create a temporary file path (ffmpeg needs file path, not buffer)
      const tempPath = `/tmp/temp_audio_${Date.now()}`;
      
      // Write buffer to temp file
      require('fs').writeFileSync(tempPath, buffer);

      ffmpeg.ffprobe(tempPath, (err, metadata) => {
        // Clean up temp file
        require('fs').unlinkSync(tempPath);

        if (err) {
          reject(new AppError('Failed to get audio metadata', 500, ErrorCodes.INTERNAL_SERVER_ERROR));
          return;
        }

        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        if (!audioStream) {
          reject(new AppError('No audio stream found', 400, ErrorCodes.INVALID_FILE_TYPE));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          bitrate: parseInt(audioStream.bit_rate || '0'),
          sampleRate: audioStream.sample_rate || 0,
          channels: audioStream.channels || 0,
          format: metadata.format.format_name || 'unknown',
        });
      });
    });
  }

  /**
   * Generate waveform data for audio visualization
   */
  async generateWaveform(buffer: Buffer, samples: number = 100): Promise<number[]> {
    try {
      // This is a simplified version. In production, you might want to use
      // a more sophisticated library like wavesurfer.js backend
      const metadata = await this.getAudioMetadata(buffer);
      const waveform: number[] = [];
      
      // Generate fake waveform data for now
      // In production, use proper audio analysis
      for (let i = 0; i < samples; i++) {
        waveform.push(Math.random());
      }

      return waveform;
    } catch (error) {
      console.error('Waveform generation error:', error);
      // Return empty waveform on error
      return new Array(samples).fill(0);
    }
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number, maxSize: number): void {
    if (size > maxSize) {
      throw new AppError(
        `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
        400,
        ErrorCodes.FILE_TOO_LARGE
      );
    }
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename: string): string {
    // Remove special characters and spaces
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Convert image format
   */
  async convertImage(inputPath: string, outputPath: string, format: ExportFormat): Promise<void> {
    try {
      await sharp(inputPath)
        .toFormat(format as any)
        .toFile(outputPath);
    } catch (error) {
      console.error('Image conversion error:', error);
      throw new AppError('Failed to convert image', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Convert audio format
   */
  async convertAudio(inputPath: string, outputPath: string, format: ExportFormat): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat(format)
        .on('end', () => resolve())
        .on('error', (err) => {
          console.error('Audio conversion error:', err);
          reject(new AppError('Failed to convert audio', 500, ErrorCodes.INTERNAL_SERVER_ERROR));
        })
        .save(outputPath);
    });
  }

  /**
   * Write JSON file
   */
  async writeJsonFile(path: string, data: any): Promise<void> {
    await writeFile(path, JSON.stringify(data, null, 2));
  }
}

export const fileProcessor = new FileProcessor();
export const fileProcessing = fileProcessor;