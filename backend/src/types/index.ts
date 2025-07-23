// Common types used across the application
import { PromptType } from '@prisma/client';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export enum ErrorCodes {
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // File errors
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // AI Service errors
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  GENERATION_FAILED = 'GENERATION_FAILED',
}

// Prompt DTOs
export interface CreatePromptDto {
  title: string;
  content: string;
  type: PromptType;
  parameters?: Record<string, any>;
}

export interface UpdatePromptDto {
  title?: string;
  content?: string;
  parameters?: Record<string, any>;
}

export interface ExecutePromptDto {
  parameters?: Record<string, any>;
}

// Project DTOs
export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface AddAssetToProjectDto {
  assetId: string;
}

// Export DTOs
export type ExportFormat = 'jpg' | 'png' | 'webp' | 'mp3' | 'wav' | 'ogg';

export interface ExportOptions {
  imageFormat?: ExportFormat;
  audioFormat?: ExportFormat;
  includeMetadata?: boolean;
  skipErrors?: boolean;
}

export interface ExportProjectDto {
  options?: ExportOptions;
}

export interface ExportAssetsDto {
  assetIds: string[];
  options?: ExportOptions;
}