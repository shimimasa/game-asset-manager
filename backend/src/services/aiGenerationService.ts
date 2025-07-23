import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { storageService } from './storageService';
import { AppError } from '../utils/errors';
import { rateLimitManager } from '../utils/rateLimiter';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface ImageGenerationParams {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

interface AudioGenerationParams {
  prompt: string;
  duration?: number;
  genre?: string;
  mood?: string;
  instruments?: string[];
}

export class AIGenerationService {
  private openai: OpenAI;
  private tempDir = path.join(process.cwd(), 'temp', 'ai-generation');

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });
  }

  /**
   * Generate image using DALL-E 3
   */
  async generateImage(
    userId: string,
    promptId: string,
    params: ImageGenerationParams
  ): Promise<string> {
    try {
      // Check rate limit
      await rateLimitManager.checkLimit('openai-images', userId);

      // Call DALL-E API
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: params.prompt,
        size: params.size || '1024x1024',
        quality: params.quality || 'standard',
        style: params.style || 'vivid',
        n: 1, // DALL-E 3 only supports n=1
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No image generated');
      }

      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        throw new Error('No image URL returned');
      }

      // Download the generated image
      const tempFilePath = path.join(this.tempDir, `${uuidv4()}.png`);
      await this.downloadImage(imageUrl, tempFilePath);

      // Upload to S3
      const filename = `generated_${Date.now()}.png`;
      const uploadResult = await storageService.uploadImage(
        {
          buffer: require('fs').readFileSync(tempFilePath),
          originalname: filename,
          mimetype: 'image/png',
          size: require('fs').statSync(tempFilePath).size,
        } as Express.Multer.File,
        userId
      );

      // Create asset record
      const asset = await prisma.asset.create({
        data: {
          filename,
          fileType: 'IMAGE',
          mimeType: 'image/png',
          fileSize: uploadResult.fileSize,
          storageUrl: uploadResult.fileUrl,
          thumbnailUrl: uploadResult.thumbnailUrl,
          metadata: uploadResult.metadata,
          userId,
          promptId,
          tags: ['ai-generated', 'dall-e-3'],
          category: 'generated',
        },
      });

      // Clean up temp file
      await unlink(tempFilePath).catch(console.error);

      return asset.id;
    } catch (error) {
      console.error('Image generation error:', error);
      
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          throw new AppError('Rate limit exceeded. Please try again later.', 429);
        } else if (error.status === 401) {
          throw new AppError('Invalid API key', 401);
        } else if (error.status === 400) {
          throw new AppError('Invalid generation parameters', 400);
        }
      }
      
      throw new AppError('Failed to generate image', 500);
    }
  }

  /**
   * Generate audio using Suno API (Mock implementation)
   */
  async generateAudio(
    userId: string,
    promptId: string,
    params: AudioGenerationParams
  ): Promise<string> {
    try {
      // Check rate limit
      await rateLimitManager.checkLimit('suno-requests', userId);
      
      // TODO: Integrate with actual Suno API when available
      // For now, this is a mock implementation
      
      console.log('Audio generation requested:', params);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In a real implementation:
      // 1. Call Suno API with prompt and parameters
      // 2. Get the generated audio URL
      // 3. Download the audio file
      // 4. Upload to S3
      // 5. Create asset record
      
      // Mock response
      const mockAsset = await prisma.asset.create({
        data: {
          filename: `generated_audio_${Date.now()}.mp3`,
          fileType: 'AUDIO',
          mimeType: 'audio/mpeg',
          fileSize: 1024 * 1024 * 3, // 3MB mock size
          storageUrl: 'https://example.com/mock-audio.mp3',
          metadata: {
            duration: params.duration || 60,
            genre: params.genre || 'electronic',
            mood: params.mood || 'energetic',
            bitrate: 320000,
            sampleRate: 44100,
          },
          userId,
          promptId,
          tags: ['ai-generated', 'suno', 'mock'],
          category: 'generated',
        },
      });
      
      return mockAsset.id;
    } catch (error) {
      console.error('Audio generation error:', error);
      throw new AppError('Failed to generate audio', 500);
    }
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = createWriteStream(filepath);
      
      https.get(url, (response) => {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        unlink(filepath).catch(console.error);
        reject(err);
      });
      
      file.on('error', (err) => {
        unlink(filepath).catch(console.error);
        reject(err);
      });
    });
  }

  /**
   * Validate generation parameters
   */
  validateImageParams(params: ImageGenerationParams): void {
    if (!params.prompt || params.prompt.trim().length === 0) {
      throw new AppError('Prompt is required', 400);
    }
    
    if (params.prompt.length > 4000) {
      throw new AppError('Prompt too long (max 4000 characters)', 400);
    }
    
    const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
    if (params.size && !validSizes.includes(params.size)) {
      throw new AppError('Invalid image size', 400);
    }
  }

  validateAudioParams(params: AudioGenerationParams): void {
    if (!params.prompt || params.prompt.trim().length === 0) {
      throw new AppError('Prompt is required', 400);
    }
    
    if (params.duration && (params.duration < 5 || params.duration > 300)) {
      throw new AppError('Duration must be between 5 and 300 seconds', 400);
    }
  }
}

export const aiGenerationService = new AIGenerationService();