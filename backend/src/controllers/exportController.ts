import { Request, Response } from 'express';
import { exportService } from '../services/exportService';
import { ExportProjectDto, ExportAssetsDto } from '../types';

export const exportController = {
  async exportProject(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    const { options }: ExportProjectDto = req.body;

    const downloadUrl = await exportService.exportProject(id, userId, options || {});
    
    res.status(201).json({
      message: 'Export started successfully',
      downloadUrl,
    });
  },

  async exportAssets(req: Request, res: Response) {
    const userId = req.user!.id;
    const { assetIds, options }: ExportAssetsDto = req.body;

    const downloadUrl = await exportService.exportAssets(assetIds, userId, options || {});
    
    res.status(201).json({
      message: 'Export started successfully',
      downloadUrl,
    });
  },

  async getExportStatus(req: Request, res: Response) {
    const userId = req.user!.id;
    const { exportId } = req.params;

    const status = await exportService.getExportStatus(exportId, userId);
    res.json(status);
  },
};