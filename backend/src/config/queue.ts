import Bull from 'bull';
import { PromptExecution } from '@prisma/client';

// Queue configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Define job data types
export interface ImageGenerationJobData {
  executionId: string;
  promptId: string;
  userId: string;
  prompt: string;
  parameters: Record<string, any>;
}

export interface AudioGenerationJobData {
  executionId: string;
  promptId: string;
  userId: string;
  prompt: string;
  parameters: Record<string, any>;
}

// Create queues
export const imageGenerationQueue = new Bull<ImageGenerationJobData>(
  'image-generation',
  REDIS_URL,
  {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  }
);

export const audioGenerationQueue = new Bull<AudioGenerationJobData>(
  'audio-generation',
  REDIS_URL,
  {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  }
);

// Queue event handlers
const setupQueueEvents = (queue: Bull.Queue, queueName: string) => {
  queue.on('completed', (job, result) => {
    console.log(`[${queueName}] Job ${job.id} completed`);
  });

  queue.on('failed', (job, err) => {
    console.error(`[${queueName}] Job ${job.id} failed:`, err);
  });

  queue.on('stalled', (job) => {
    console.warn(`[${queueName}] Job ${job.id} stalled`);
  });

  queue.on('error', (err) => {
    console.error(`[${queueName}] Queue error:`, err);
  });
};

// Initialize queue event handlers
setupQueueEvents(imageGenerationQueue, 'ImageGeneration');
setupQueueEvents(audioGenerationQueue, 'AudioGeneration');

// Graceful shutdown
export const shutdownQueues = async () => {
  await imageGenerationQueue.close();
  await audioGenerationQueue.close();
};