import { PrismaClient, PromptExecution, PromptExecutionStatus } from '@prisma/client';
import { imageGenerationQueue, audioGenerationQueue } from '../config/queue';
import { promptService } from './promptService';
import { AppError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class PromptExecutionService {
  async execute(
    promptId: string,
    userId: string,
    parameters?: Record<string, any>
  ): Promise<PromptExecution> {
    // Get prompt
    const prompt = await promptService.findById(promptId, userId);
    if (!prompt) {
      throw new AppError('Prompt not found', 404);
    }

    // Create execution record
    const execution = await prisma.promptExecution.create({
      data: {
        id: uuidv4(),
        promptId,
        userId,
        status: PromptExecutionStatus.PENDING,
        parameters: { ...prompt.parameters, ...parameters },
      },
    });

    // Increment usage count
    await promptService.incrementUsage(promptId);

    // Add to appropriate queue
    const jobData = {
      executionId: execution.id,
      promptId: prompt.id,
      userId,
      prompt: prompt.content,
      parameters: execution.parameters as Record<string, any>,
    };

    if (prompt.type === 'IMAGE') {
      await imageGenerationQueue.add('generate', jobData);
    } else if (prompt.type === 'AUDIO') {
      await audioGenerationQueue.add('generate', jobData);
    }

    return execution;
  }

  async findAll(
    userId: string,
    options?: {
      promptId?: string;
      status?: PromptExecutionStatus;
      limit?: number;
      offset?: number;
    }
  ) {
    const {
      promptId,
      status,
      limit = 20,
      offset = 0,
    } = options || {};

    const where = {
      userId,
      ...(promptId && { promptId }),
      ...(status && { status }),
    };

    const [executions, total] = await Promise.all([
      prisma.promptExecution.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          prompt: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          generatedAsset: true,
        },
      }),
      prisma.promptExecution.count({ where }),
    ]);

    return {
      executions,
      total,
      limit,
      offset,
    };
  }

  async findById(id: string, userId: string): Promise<PromptExecution | null> {
    const execution = await prisma.promptExecution.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        prompt: true,
        generatedAsset: true,
      },
    });

    if (!execution) {
      throw new AppError('Execution not found', 404);
    }

    return execution;
  }

  async updateStatus(
    executionId: string,
    status: PromptExecutionStatus,
    result?: any,
    error?: string
  ): Promise<void> {
    await prisma.promptExecution.update({
      where: { id: executionId },
      data: {
        status,
        result: result || undefined,
        error: error || undefined,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
      },
    });

    // Update prompt success rate if completed or failed
    if (status === 'COMPLETED' || status === 'FAILED') {
      const execution = await prisma.promptExecution.findUnique({
        where: { id: executionId },
        select: { promptId: true },
      });
      
      if (execution) {
        await promptService.updateSuccessRate(execution.promptId);
      }
    }
  }

  async linkGeneratedAsset(executionId: string, assetId: string): Promise<void> {
    await prisma.promptExecution.update({
      where: { id: executionId },
      data: {
        generatedAssetId: assetId,
      },
    });
  }

  async cancel(id: string, userId: string): Promise<void> {
    const execution = await this.findById(id, userId);
    if (!execution) {
      throw new AppError('Execution not found', 404);
    }

    if (execution.status !== 'PENDING' && execution.status !== 'PROCESSING') {
      throw new AppError('Cannot cancel execution in current status', 400);
    }

    // Update status
    await this.updateStatus(id, 'FAILED', null, 'Cancelled by user');

    // Try to remove from queue
    const prompt = await prisma.prompt.findUnique({
      where: { id: execution.promptId },
      select: { type: true },
    });

    if (prompt?.type === 'IMAGE') {
      const jobs = await imageGenerationQueue.getJobs(['waiting', 'active']);
      const job = jobs.find(j => j.data.executionId === id);
      if (job) await job.remove();
    } else if (prompt?.type === 'AUDIO') {
      const jobs = await audioGenerationQueue.getJobs(['waiting', 'active']);
      const job = jobs.find(j => j.data.executionId === id);
      if (job) await job.remove();
    }
  }
}

export const promptExecutionService = new PromptExecutionService();