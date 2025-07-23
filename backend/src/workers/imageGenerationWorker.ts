import { Job } from 'bull';
import { imageGenerationQueue, ImageGenerationJobData } from '../config/queue';
import { promptExecutionService } from '../services/promptExecutionService';
import { aiGenerationService } from '../services/aiGenerationService';
import { PrismaClient } from '@prisma/client';
import { mkdir } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Process image generation jobs
imageGenerationQueue.process('generate', async (job: Job<ImageGenerationJobData>) => {
  const { executionId, promptId, userId, prompt, parameters } = job.data;

  try {
    // Update status to processing
    await promptExecutionService.updateStatus(executionId, 'PROCESSING');

    console.log(`Processing image generation for execution ${executionId}`);

    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp', 'ai-generation');
    await mkdir(tempDir, { recursive: true });

    // Validate parameters
    const imageParams = {
      prompt,
      size: parameters.size || '1024x1024',
      quality: parameters.quality || 'standard',
      style: parameters.style || 'vivid',
    };
    
    aiGenerationService.validateImageParams(imageParams);

    // Generate image using DALL-E
    const assetId = await aiGenerationService.generateImage(
      userId,
      promptId,
      imageParams
    );

    // Link generated asset to execution
    await promptExecutionService.linkGeneratedAsset(executionId, assetId);

    // Get asset details for result
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    const result = {
      message: 'Image generated successfully',
      assetId,
      assetUrl: asset?.storageUrl,
      thumbnailUrl: asset?.thumbnailUrl,
      prompt,
      parameters: imageParams,
      timestamp: new Date().toISOString(),
    };

    // Update execution status
    await promptExecutionService.updateStatus(executionId, 'COMPLETED', result);

    return result;
  } catch (error) {
    // Update execution status with error
    await promptExecutionService.updateStatus(
      executionId,
      'FAILED',
      null,
      error instanceof Error ? error.message : 'Unknown error'
    );

    throw error;
  }
});

// Start worker
console.log('Image generation worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down image generation worker...');
  await imageGenerationQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});