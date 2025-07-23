import { APIRequestContext } from '@playwright/test';

export class APIHelper {
  constructor(private request: APIRequestContext) {}

  async createAuthenticatedUser(user = {
    username: 'apiuser',
    email: 'api@example.com',
    password: 'ApiPassword123!',
  }) {
    // Register user
    const registerResponse = await this.request.post('http://localhost:3000/api/auth/register', {
      data: user,
    });

    const { accessToken, refreshToken } = await registerResponse.json();
    
    return {
      user,
      accessToken,
      refreshToken,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  async createAsset(authHeaders: Record<string, string>, assetData: any) {
    const formData = new FormData();
    
    // Create a test file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);
    
    if (assetData.tags) {
      formData.append('tags', assetData.tags);
    }
    if (assetData.category) {
      formData.append('category', assetData.category);
    }

    const response = await this.request.post('http://localhost:3000/api/assets/upload', {
      headers: authHeaders,
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('test content'),
        },
        tags: assetData.tags || '',
        category: assetData.category || '',
      },
    });

    return response.json();
  }

  async createProject(authHeaders: Record<string, string>, projectData: any) {
    const response = await this.request.post('http://localhost:3000/api/projects', {
      headers: authHeaders,
      data: projectData,
    });

    return response.json();
  }

  async createPrompt(authHeaders: Record<string, string>, promptData: any) {
    const response = await this.request.post('http://localhost:3000/api/prompts', {
      headers: authHeaders,
      data: promptData,
    });

    return response.json();
  }

  async cleanupTestData(authHeaders: Record<string, string>) {
    // Clean up in reverse order of dependencies
    
    // Get and delete all exports
    const exportsResponse = await this.request.get('http://localhost:3000/api/export/history', {
      headers: authHeaders,
    });
    
    if (exportsResponse.ok()) {
      const exports = await exportsResponse.json();
      for (const exp of exports) {
        await this.request.delete(`http://localhost:3000/api/export/${exp.id}`, {
          headers: authHeaders,
        });
      }
    }

    // Get and delete all projects
    const projectsResponse = await this.request.get('http://localhost:3000/api/projects', {
      headers: authHeaders,
    });
    
    if (projectsResponse.ok()) {
      const { data: projects } = await projectsResponse.json();
      for (const project of projects) {
        await this.request.delete(`http://localhost:3000/api/projects/${project.id}`, {
          headers: authHeaders,
        });
      }
    }

    // Get and delete all prompts
    const promptsResponse = await this.request.get('http://localhost:3000/api/prompts', {
      headers: authHeaders,
    });
    
    if (promptsResponse.ok()) {
      const { data: prompts } = await promptsResponse.json();
      for (const prompt of prompts) {
        await this.request.delete(`http://localhost:3000/api/prompts/${prompt.id}`, {
          headers: authHeaders,
        });
      }
    }

    // Get and delete all assets
    const assetsResponse = await this.request.get('http://localhost:3000/api/assets', {
      headers: authHeaders,
    });
    
    if (assetsResponse.ok()) {
      const { data: assets } = await assetsResponse.json();
      for (const asset of assets) {
        await this.request.delete(`http://localhost:3000/api/assets/${asset.id}`, {
          headers: authHeaders,
        });
      }
    }
  }
}