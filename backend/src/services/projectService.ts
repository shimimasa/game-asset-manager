import { PrismaClient, Project, Prisma } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from '../types';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export class ProjectService {
  async create(userId: string, data: CreateProjectDto): Promise<Project> {
    return prisma.project.create({
      data: {
        ...data,
        userId,
      },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });
  }

  async findAll(
    userId: string,
    options?: {
      search?: string;
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'updatedAt' | 'name';
      order?: 'asc' | 'desc';
    }
  ) {
    const {
      search,
      limit = 20,
      offset = 0,
      orderBy = 'createdAt',
      order = 'desc',
    } = options || {};

    const where: Prisma.ProjectWhereInput = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [orderBy]: order },
        include: {
          _count: {
            select: {
              assets: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
      limit,
      offset,
    };
  }

  async findById(id: string, userId: string): Promise<Project | null> {
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        assets: {
          include: {
            asset: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return project;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateProjectDto
  ): Promise<Project> {
    const project = await this.findById(id, userId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return prisma.project.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const project = await this.findById(id, userId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await prisma.project.delete({
      where: { id },
    });
  }

  async addAsset(
    projectId: string,
    assetId: string,
    userId: string
  ): Promise<void> {
    // Verify project ownership
    const project = await this.findById(projectId, userId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Verify asset ownership
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        userId,
      },
    });

    if (!asset) {
      throw new AppError('Asset not found or access denied', 404);
    }

    // Check if already exists
    const existing = await prisma.projectAsset.findUnique({
      where: {
        projectId_assetId: {
          projectId,
          assetId,
        },
      },
    });

    if (existing) {
      throw new AppError('Asset already in project', 409);
    }

    // Add asset to project
    await prisma.projectAsset.create({
      data: {
        projectId,
        assetId,
      },
    });
  }

  async removeAsset(
    projectId: string,
    assetId: string,
    userId: string
  ): Promise<void> {
    // Verify project ownership
    const project = await this.findById(projectId, userId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Remove asset from project
    const result = await prisma.projectAsset.deleteMany({
      where: {
        projectId,
        assetId,
      },
    });

    if (result.count === 0) {
      throw new AppError('Asset not found in project', 404);
    }
  }

  async getAssets(
    projectId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const { limit = 50, offset = 0 } = options || {};

    // Verify project ownership
    const project = await this.findById(projectId, userId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const [assets, total] = await Promise.all([
      prisma.projectAsset.findMany({
        where: { projectId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: true,
        },
      }),
      prisma.projectAsset.count({
        where: { projectId },
      }),
    ]);

    return {
      assets: assets.map((pa) => pa.asset),
      total,
      limit,
      offset,
    };
  }

  async duplicate(id: string, userId: string): Promise<Project> {
    const original = await this.findById(id, userId);
    if (!original) {
      throw new AppError('Project not found', 404);
    }

    // Create new project
    const newProject = await prisma.project.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        userId,
      },
    });

    // Copy assets
    const projectAssets = await prisma.projectAsset.findMany({
      where: { projectId: id },
      select: { assetId: true },
    });

    if (projectAssets.length > 0) {
      await prisma.projectAsset.createMany({
        data: projectAssets.map((pa) => ({
          projectId: newProject.id,
          assetId: pa.assetId,
        })),
      });
    }

    return this.findById(newProject.id, userId) as Promise<Project>;
  }
}

export const projectService = new ProjectService();