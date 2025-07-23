import { api } from './api';

export interface ExportOptions {
  format: 'WEBP' | 'JPG' | 'PNG' | 'ZIP';
  quality?: number;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: string;
  quality?: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export const exportService = {
  // Export single asset
  async exportAsset(assetId: string, options: ExportOptions): Promise<ExportJob> {
    const response = await api.post(`/export/asset/${assetId}`, options);
    return response.data;
  },

  // Export multiple assets
  async exportAssets(assetIds: string[], options: ExportOptions): Promise<ExportJob> {
    const response = await api.post('/export/assets', {
      assetIds,
      ...options,
    });
    return response.data;
  },

  // Export project
  async exportProject(projectId: string, options: ExportOptions & { assetIds?: string[] }): Promise<ExportJob> {
    const response = await api.post(`/export/project/${projectId}`, options);
    return response.data;
  },

  // Get export job status
  async getExportStatus(jobId: string): Promise<ExportJob> {
    const response = await api.get(`/export/status/${jobId}`);
    return response.data;
  },

  // Download exported file
  async downloadExport(jobId: string): Promise<Blob> {
    const response = await api.get(`/export/download/${jobId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get export history
  async getExportHistory(limit: number = 20): Promise<ExportJob[]> {
    const response = await api.get(`/export/history?limit=${limit}`);
    return response.data;
  },
};