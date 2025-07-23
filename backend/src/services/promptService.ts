import { PrismaClient, Prompt, PromptType, Prisma } from '@prisma/client';
import { CreatePromptDto, UpdatePromptDto } from '../types';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export class PromptService {
  async create(userId: string, data: CreatePromptDto): Promise<Prompt> {
    return prisma.prompt.create({
      data: {
        ...data,
        userId,
        parameters: data.parameters || {},
        usageCount: 0,
        successRate: 0,
      },
    });
  }

  async findAll(
    userId: string,
    options?: {
      type?: PromptType;
      search?: string;
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'updatedAt' | 'usageCount' | 'title';
      order?: 'asc' | 'desc';
    }
  ) {
    const {
      type,
      search,
      limit = 20,
      offset = 0,
      orderBy = 'createdAt',
      order = 'desc',
    } = options || {};

    const where: Prisma.PromptWhereInput = {
      userId,
      ...(type && { type }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [orderBy]: order },
        include: {
          _count: {
            select: {
              executions: true,
              generatedAssets: true,
            },
          },
        },
      }),
      prisma.prompt.count({ where }),
    ]);

    return {
      prompts,
      total,
      limit,
      offset,
    };
  }

  async findById(id: string, userId: string): Promise<Prompt | null> {
    const prompt = await prisma.prompt.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        executions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        generatedAssets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!prompt) {
      throw new AppError('Prompt not found', 404);
    }

    return prompt;
  }

  async update(
    id: string,
    userId: string,
    data: UpdatePromptDto
  ): Promise<Prompt> {
    const prompt = await this.findById(id, userId);
    if (!prompt) {
      throw new AppError('Prompt not found', 404);
    }

    return prisma.prompt.update({
      where: { id },
      data: {
        ...data,
        parameters: data.parameters || prompt.parameters,
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const prompt = await this.findById(id, userId);
    if (!prompt) {
      throw new AppError('Prompt not found', 404);
    }

    await prisma.prompt.delete({
      where: { id },
    });
  }

  async incrementUsage(id: string): Promise<void> {
    await prisma.prompt.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });
  }

  async updateSuccessRate(id: string): Promise<void> {
    const executions = await prisma.promptExecution.findMany({
      where: { promptId: id },
      select: { status: true },
    });

    if (executions.length === 0) return;

    const successCount = executions.filter(
      (e) => e.status === 'COMPLETED'
    ).length;
    const successRate = Math.round((successCount / executions.length) * 100);

    await prisma.prompt.update({
      where: { id },
      data: { successRate },
    });
  }

  async clone(id: string, userId: string): Promise<Prompt> {
    const original = await this.findById(id, userId);
    if (!original) {
      throw new AppError('Prompt not found', 404);
    }

    return prisma.prompt.create({
      data: {
        title: `${original.title} (Copy)`,
        content: original.content,
        type: original.type,
        parameters: original.parameters as Prisma.JsonObject,
        userId,
        usageCount: 0,
        successRate: 0,
      },
    });
  }
}

export const promptService = new PromptService();