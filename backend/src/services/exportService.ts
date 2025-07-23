import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'fs';
import { mkdir, rm } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storageService';
import { fileProcessing } from '../utils/fileProcessing';
import { AppError } from '../utils/errors';
import { ExportOptions, ExportFormat } from '../types';

const prisma = new PrismaClient();

export class ExportService {
  private tempDir = path.join(process.cwd(), 'temp', 'exports');

  async exportProject(
    projectId: string,
    userId: string,
    options: ExportOptions
  ): Promise<string> {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const exportId = uuidv4();
    const exportPath = path.join(this.tempDir, exportId);
    
    try {
      // Create temporary directory
      await mkdir(exportPath, { recursive: true });

      // Process assets
      const processedAssets = await this.processAssets(
        project.assets.map(pa => pa.asset),
        exportPath,
        options
      );

      // Create manifest
      await this.createManifest(project, processedAssets, exportPath);

      // Create ZIP archive
      const zipPath = await this.createZipArchive(exportPath, exportId);

      // Upload to S3
      const s3Key = `exports/${userId}/${exportId}.zip`;
      const downloadUrl = await storageService.uploadFromPath(zipPath, s3Key);

      // Clean up temporary files
      await rm(exportPath, { recursive: true, force: true });
      await rm(zipPath, { force: true });

      // Save export record
      await prisma.export.create({
        data: {
          id: exportId,
          projectId,
          userId,
          downloadUrl,
          options: options as any,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return downloadUrl;
    } catch (error) {
      // Clean up on error
      await rm(exportPath, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  async exportAssets(
    assetIds: string[],
    userId: string,
    options: ExportOptions
  ): Promise<string> {
    // Verify asset ownership
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        userId,
      },
    });

    if (assets.length !== assetIds.length) {
      throw new AppError('Some assets not found or access denied', 404);
    }

    const exportId = uuidv4();
    const exportPath = path.join(this.tempDir, exportId);
    
    try {
      // Create temporary directory
      await mkdir(exportPath, { recursive: true });

      // Process assets
      const processedAssets = await this.processAssets(assets, exportPath, options);

      // Create manifest
      await this.createManifest(null, processedAssets, exportPath);

      // Create ZIP archive
      const zipPath = await this.createZipArchive(exportPath, exportId);

      // Upload to S3
      const s3Key = `exports/${userId}/${exportId}.zip`;
      const downloadUrl = await storageService.uploadFromPath(zipPath, s3Key);

      // Clean up temporary files
      await rm(exportPath, { recursive: true, force: true });
      await rm(zipPath, { force: true });

      return downloadUrl;
    } catch (error) {
      // Clean up on error
      await rm(exportPath, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  private async processAssets(
    assets: any[],
    exportPath: string,
    options: ExportOptions
  ): Promise<any[]> {
    const processedAssets = [];

    for (const asset of assets) {
      try {
        let processedPath: string;

        if (asset.fileType === 'IMAGE' && options.imageFormat) {
          // Convert image format
          processedPath = await this.convertImage(
            asset,
            exportPath,
            options.imageFormat
          );
        } else if (asset.fileType === 'AUDIO' && options.audioFormat) {
          // Convert audio format
          processedPath = await this.convertAudio(
            asset,
            exportPath,
            options.audioFormat
          );
        } else {
          // Copy original file
          processedPath = await this.downloadAsset(asset, exportPath);
        }

        processedAssets.push({
          ...asset,
          exportPath: path.basename(processedPath),
        });
      } catch (error) {
        console.error(`Failed to process asset ${asset.id}:`, error);
        if (!options.skipErrors) {
          throw error;
        }
      }
    }

    return processedAssets;
  }

  private async convertImage(
    asset: any,
    exportPath: string,
    format: ExportFormat
  ): Promise<string> {
    // Download original file
    const originalPath = await this.downloadAsset(asset, exportPath);
    
    // Convert format
    const outputPath = path.join(
      exportPath,
      `${path.parse(asset.filename).name}.${format}`
    );

    await fileProcessing.convertImage(originalPath, outputPath, format);

    // Remove original if different format
    if (path.extname(asset.filename).slice(1) !== format) {
      await rm(originalPath, { force: true });
    }

    return outputPath;
  }

  private async convertAudio(
    asset: any,
    exportPath: string,
    format: ExportFormat
  ): Promise<string> {
    // Download original file
    const originalPath = await this.downloadAsset(asset, exportPath);
    
    // Convert format
    const outputPath = path.join(
      exportPath,
      `${path.parse(asset.filename).name}.${format}`
    );

    await fileProcessing.convertAudio(originalPath, outputPath, format);

    // Remove original if different format
    if (path.extname(asset.filename).slice(1) !== format) {
      await rm(originalPath, { force: true });
    }

    return outputPath;
  }

  private async downloadAsset(asset: any, exportPath: string): Promise<string> {
    const outputPath = path.join(exportPath, asset.filename);
    await storageService.downloadToPath(asset.storageUrl, outputPath);
    return outputPath;
  }

  private async createManifest(
    project: any | null,
    assets: any[],
    exportPath: string
  ): Promise<void> {
    const manifest = {
      exportDate: new Date().toISOString(),
      project: project ? {
        id: project.id,
        name: project.name,
        description: project.description,
      } : null,
      assets: assets.map(asset => ({
        id: asset.id,
        filename: asset.exportPath || asset.filename,
        originalFilename: asset.filename,
        fileType: asset.fileType,
        fileSize: asset.fileSize,
        metadata: asset.metadata,
        tags: asset.tags,
        category: asset.category,
      })),
      totalAssets: assets.length,
    };

    const manifestPath = path.join(exportPath, 'manifest.json');
    await fileProcessing.writeJsonFile(manifestPath, manifest);
  }

  private async createZipArchive(
    sourcePath: string,
    exportId: string
  ): Promise<string> {
    const zipPath = path.join(this.tempDir, `${exportId}.zip`);
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(zipPath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourcePath, false);
      archive.finalize();
    });
  }

  async getExportStatus(exportId: string, userId: string): Promise<any> {
    const exportRecord = await prisma.export.findFirst({
      where: {
        id: exportId,
        userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!exportRecord) {
      throw new AppError('Export not found', 404);
    }

    return exportRecord;
  }

  async cleanupExpiredExports(): Promise<void> {
    const expired = await prisma.export.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    for (const exp of expired) {
      try {
        // Delete from S3
        await storageService.deleteFile(exp.downloadUrl);
        
        // Delete record
        await prisma.export.delete({
          where: { id: exp.id },
        });
      } catch (error) {
        console.error(`Failed to cleanup export ${exp.id}:`, error);
      }
    }
  }
}

export const exportService = new ExportService();