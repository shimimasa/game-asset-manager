// User types
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

// Asset types
export interface Asset {
  id: string;
  filename: string;
  fileType: 'IMAGE' | 'AUDIO';
  mimeType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  tags: string[];
  category?: string;
  userId: string;
  promptId?: string;
  createdAt: string;
  updatedAt: string;
}

// Prompt types
export interface Prompt {
  id: string;
  title: string;
  content: string;
  type: 'IMAGE' | 'AUDIO';
  parameters?: Record<string, any>;
  usageCount: number;
  successRate: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    executions: number;
    generatedAssets: number;
  };
}

export interface PromptExecution {
  id: string;
  promptId: string;
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  parameters?: Record<string, any>;
  result?: any;
  error?: string;
  generatedAssetId?: string;
  generatedAsset?: Asset;
  prompt?: Prompt;
  createdAt: string;
  completedAt?: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
  };
  assets?: ProjectAsset[];
}

export interface ProjectAsset {
  projectId: string;
  assetId: string;
  asset: Asset;
  createdAt: string;
}

// Export types
export interface Export {
  id: string;
  projectId?: string;
  userId: string;
  downloadUrl: string;
  options?: ExportOptions;
  expiresAt: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface ExportOptions {
  imageFormat?: 'jpg' | 'png' | 'webp';
  audioFormat?: 'mp3' | 'wav' | 'ogg';
  includeMetadata?: boolean;
  skipErrors?: boolean;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
}

export interface CreatePromptData {
  title: string;
  content: string;
  type: 'IMAGE' | 'AUDIO';
  parameters?: Record<string, any>;
}

export interface CreateProjectData {
  name: string;
  description?: string;
}