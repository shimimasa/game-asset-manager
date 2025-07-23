// TypeScript型定義（Prismaモデルに対応）

export interface Asset {
  id: string;
  filename: string;
  originalName: string;
  fileType: 'IMAGE' | 'AUDIO';
  mimeType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    bitrate?: number;
    [key: string]: any;
  };
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  promptId?: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  type: 'IMAGE' | 'AUDIO';
  parameters?: {
    style?: string;
    quality?: string;
    duration?: number;
    [key: string]: any;
  };
  category?: string;
  usageCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptExecution {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  resultData?: any;
  promptId: string;
}

// DTOs (Data Transfer Objects)
export interface CreateAssetDto {
  filename: string;
  originalName: string;
  fileType: 'IMAGE' | 'AUDIO';
  mimeType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  category?: string;
  promptId?: string;
}

export interface UpdateAssetDto {
  tags?: string[];
  category?: string;
}

export interface CreatePromptDto {
  title: string;
  content: string;
  type: 'IMAGE' | 'AUDIO';
  parameters?: Record<string, any>;
  category?: string;
}

export interface UpdatePromptDto {
  title?: string;
  content?: string;
  parameters?: Record<string, any>;
  category?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}