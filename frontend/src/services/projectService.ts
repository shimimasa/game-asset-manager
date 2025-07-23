import { api } from './api';
import { Project, PaginatedResponse, CreateProjectData, Asset } from '../types';

export interface ProjectFilters {
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'name';
  order?: 'asc' | 'desc';
}

export const projectService = {
  // Get all projects
  async getProjects(filters: ProjectFilters = {}): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.orderBy) params.append('orderBy', filters.orderBy);
    if (filters.order) params.append('order', filters.order);

    const response = await api.get(`/projects?${params.toString()}`);
    return response.data;
  },

  // Get single project
  async getProject(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create project
  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  // Update project
  async updateProject(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  // Delete project
  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  // Duplicate project
  async duplicateProject(id: string): Promise<Project> {
    const response = await api.post(`/projects/${id}/duplicate`);
    return response.data;
  },

  // Get project assets
  async getProjectAssets(id: string, options?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Asset>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await api.get(`/projects/${id}/assets?${params.toString()}`);
    return response.data;
  },

  // Add asset to project
  async addAssetToProject(projectId: string, assetId: string): Promise<void> {
    await api.post(`/projects/${projectId}/assets`, { assetId });
  },

  // Remove asset from project
  async removeAssetFromProject(projectId: string, assetId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/assets/${assetId}`);
  },
};