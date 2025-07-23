import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storageService';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ErrorCodes } from '../types';
import { cacheService } from '../services/cacheService';

export class AssetController {
  /**
   * Upload single asset
   */
  async uploadAsset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, ErrorCodes.UNAUTHORIZED);
      }

      if (!req.file) {
        throw new AppError('No file provided', 400, ErrorCodes.VALIDATION_ERROR);
      }

      // Upload file to storage
      const uploadResult = await storageService.uploadFile(req.file, req.user.userId);

      // Extract tags and category from request body
      const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
      const category = req.body.category || null;
      const promptId = req.body.promptId || null;

      // Save asset to database
      const asset = await prisma.asset.create({
        data: {
          filename: req.file.filename || req.file.originalname,
          originalName: req.file.originalname,
          fileType: uploadResult.fileType,
          mimeType: req.file.mimetype,
          fileSize: uploadResult.fileSize,
          storageUrl: uploadResult.fileUrl,
          thumbnailUrl: uploadResult.thumbnailUrl,
          metadata: uploadResult.metadata,
          tags,
          category,
          userId: req.user.userId,
          promptId,
        },
      });

      // Invalidate user's asset cache
      await cacheService.invalidateAssetCache(req.user.userId);

      res.status(201).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all assets with pagination and filters
   */
  async getAssets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, ErrorCodes.UNAUTHORIZED);
      }

      const {
        page = '1',
        limit = '20',
        fileType,
        category,
        tags,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter conditions
      const where: any = {
        userId: req.user.userId,
      };

      if (fileType) {
        where.fileType = fileType;
      }

      if (category) {
        where.category = category;
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        where.tags = {
          hasSome: tagArray as string[],
        };
      }

      if (search) {
        where.OR = [
          { originalName: { contains: search as string, mode: 'insensitive' } },
          { tags: { has: search as string } },
        ];
      }

      // Get total count and assets
      const [total, assets] = await Promise.all([
        prisma.asset.count({ where }),
        prisma.asset.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: {
            [sortBy as string]: sortOrder,
          },
          include: {
            prompt: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
            projects: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: assets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single asset by ID
   */
  async getAsset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, ErrorCodes.UNAUTHORIZED);
      }

      const { id } = req.params;

      const asset = await prisma.asset.findFirst({
        where: {
          id,
          userId: req.user.userId,
        },
        include: {
          prompt: true,
          projects: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!asset) {
        throw new AppError('Asset not found', 404, ErrorCodes.NOT_FOUND);
      }

      res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update asset metadata
   */
  async updateAsset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, ErrorCodes.UNAUTHORIZED);
      }

      const { id } = req.params;
      const { tags, category } = req.body;

      // Check if asset exists and belongs to user
      const existingAsset = await prisma.asset.findFirst({
        where: {
          id,
          userId: req.user.userId,
        },
      });

      if (!existingAsset) {
        throw new AppError('Asset not found', 404, ErrorCodes.NOT_FOUND);
      }

      // Update asset
      const asset = await prisma.asset.update({
        where: { id },
        data: {
          tags: tags !== undefined ? tags : existingAsset.tags,
          category: category !== undefined ? category : existingAsset.category,
        },
      });

      // Invalidate caches
      await cacheService.invalidateAssetCache(req.user.userId, id);

      res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, ErrorCodes.UNAUTHORIZED);
      }

      const { id } = req.params;

      // Check if asset exists and belongs to user
      const asset = await prisma.asset.findFirst({
        where: {
          id,
          userId: req.user.userId,
        },
      });

      if (!asset) {
        throw new AppError('Asset not found', 404, ErrorCodes.NOT_FOUND);
      }

      // Delete from storage
      await storageService.deleteFile(asset.storageUrl, asset.thumbnailUrl || undefined);

      // Delete from database
      await prisma.asset.delete({
        where: { id },
      });

      // Invalidate caches
      await cacheService.invalidateAssetCache(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Asset deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get presigned upload URL
   */
  async getUploadUrl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, ErrorCodes.UNAUTHORIZED);
      }

      const { filename, mimeType } = req.body;

      if (!filename || !mimeType) {
        throw new AppError('Filename and mimeType are required', 400, ErrorCodes.VALIDATION_ERROR);
      }

      const { uploadUrl, fileKey } = await storageService.getUploadUrl(
        filename,
        mimeType,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        data: {
          uploadUrl,
          fileKey,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const assetController = new AssetController();