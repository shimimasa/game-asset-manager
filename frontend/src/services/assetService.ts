import { api } from './api';
import { Asset, PaginatedResponse } from '../types';

export interface AssetFilters {
  search?: string;
  fileType?: 'IMAGE' | 'AUDIO';
  tags?: string[];
  category?: string;
  limit?: number;
  offset?: number;
}

export const assetService = {
  // Get all assets with filters
  async getAssets(filters: AssetFilters = {}): Promise<PaginatedResponse<Asset>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.fileType) params.append('fileType', filters.fileType);
    if (filters.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters.category) params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/assets?${params.toString()}`);
    return response.data;
  },

  // Get single asset
  async getAsset(id: string): Promise<Asset> {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  // Upload asset
  async uploadAsset(file: File, metadata?: { tags?: string[]; category?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata?.tags) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }
    if (metadata?.category) {
      formData.append('category', metadata.category);
    }

    const response = await api.post('/assets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update asset metadata
  async updateAsset(id: string, data: { tags?: string[]; category?: string }) {
    const response = await api.put(`/assets/${id}`, data);
    return response.data;
  },

  // Delete asset
  async deleteAsset(id: string): Promise<void> {
    await api.delete(`/assets/${id}`);
  },

  // Get upload URL for direct upload
  async getUploadUrl(filename: string, fileType: string): Promise<{ uploadUrl: string; fileKey: string }> {
    const response = await api.post('/assets/upload-url', { filename, fileType });
    return response.data;
  },
};