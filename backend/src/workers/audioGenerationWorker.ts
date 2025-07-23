import { Job } from 'bull';
import { audioGenerationQueue, AudioGenerationJobData } from '../config/queue';
import { promptExecutionService } from '../services/promptExecutionService';
import { aiGenerationService } from '../services/aiGenerationService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Process audio generation jobs
audioGenerationQueue.process('generate', async (job: Job<AudioGenerationJobData>) => {
  const { executionId, promptId, userId, prompt, parameters } = job.data;

  try {
    // Update status to processing
    await promptExecutionService.updateStatus(executionId, 'PROCESSING');

    console.log(`Processing audio generation for execution ${executionId}`);

    // Validate parameters
    const audioParams = {
      prompt,
      duration: parameters.duration || 60,
      genre: parameters.genre,
      mood: parameters.mood,
      instruments: parameters.instruments,
    };
    
    aiGenerationService.validateAudioParams(audioParams);

    // Generate audio using Suno API (currently mock implementation)
    const assetId = await aiGenerationService.generateAudio(
      userId,
      promptId,
      audioParams
    );

    // Link generated asset to execution
    await promptExecutionService.linkGeneratedAsset(executionId, assetId);

    // Get asset details for result
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    const result = {
      message: 'Audio generated successfully',
      assetId,
      assetUrl: asset?.storageUrl,
      prompt,
      parameters: audioParams,
      metadata: asset?.metadata,
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
console.log('Audio generation worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down audio generation worker...');
  await audioGenerationQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});