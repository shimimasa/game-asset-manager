import { api } from './api';
import { Prompt, PromptExecution, PaginatedResponse, CreatePromptData } from '../types';

export interface PromptFilters {
  type?: 'IMAGE' | 'AUDIO';
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'usageCount' | 'title';
  order?: 'asc' | 'desc';
}

export interface ExecutionFilters {
  promptId?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  limit?: number;
  offset?: number;
}

export const promptService = {
  // Get all prompts
  async getPrompts(filters: PromptFilters = {}): Promise<PaginatedResponse<Prompt>> {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.orderBy) params.append('orderBy', filters.orderBy);
    if (filters.order) params.append('order', filters.order);

    const response = await api.get(`/prompts?${params.toString()}`);
    return response.data;
  },

  // Get single prompt
  async getPrompt(id: string): Promise<Prompt> {
    const response = await api.get(`/prompts/${id}`);
    return response.data;
  },

  // Create prompt
  async createPrompt(data: CreatePromptData): Promise<Prompt> {
    const response = await api.post('/prompts', data);
    return response.data;
  },

  // Update prompt
  async updatePrompt(id: string, data: Partial<CreatePromptData>): Promise<Prompt> {
    const response = await api.put(`/prompts/${id}`, data);
    return response.data;
  },

  // Delete prompt
  async deletePrompt(id: string): Promise<void> {
    await api.delete(`/prompts/${id}`);
  },

  // Clone prompt
  async clonePrompt(id: string): Promise<Prompt> {
    const response = await api.post(`/prompts/${id}/clone`);
    return response.data;
  },

  // Execute prompt
  async executePrompt(id: string, parameters?: Record<string, any>): Promise<PromptExecution> {
    const response = await api.post(`/prompts/${id}/execute`, { parameters });
    return response.data;
  },

  // Get executions
  async getExecutions(filters: ExecutionFilters = {}): Promise<PaginatedResponse<PromptExecution>> {
    const params = new URLSearchParams();
    
    if (filters.promptId) params.append('promptId', filters.promptId);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/prompts/executions?${params.toString()}`);
    return response.data;
  },

  // Get single execution
  async getExecution(executionId: string): Promise<PromptExecution> {
    const response = await api.get(`/prompts/executions/${executionId}`);
    return response.data;
  },

  // Cancel execution
  async cancelExecution(executionId: string): Promise<void> {
    await api.delete(`/prompts/executions/${executionId}`);
  },
};