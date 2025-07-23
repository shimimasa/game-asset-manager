import request from 'supertest';
import { app } from '../app';
import { createAuthenticatedUser } from './setup';

describe('Prompts API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const { accessToken, user } = await createAuthenticatedUser();
    authToken = accessToken;
    userId = user.id;
  });

  describe('POST /api/prompts', () => {
    it('should create a new prompt', async () => {
      const response = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Prompt',
          description: 'A test prompt for unit testing',
          content: 'Generate a fantasy character',
          category: 'CHARACTER',
          type: 'IMAGE',
          parameters: {
            style: 'fantasy',
            quality: 'high',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Prompt');
      expect(response.body.userId).toBe(userId);
      expect(response.body.parameters).toEqual({
        style: 'fantasy',
        quality: 'high',
      });
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name and content',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/prompts', () => {
    beforeEach(async () => {
      // Create test prompts
      await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Image Prompt',
          content: 'Test image prompt',
          type: 'IMAGE',
        });

      await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Audio Prompt',
          content: 'Test audio prompt',
          type: 'AUDIO',
        });
    });

    it('should get all prompts', async () => {
      const response = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/prompts?type=IMAGE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.type === 'IMAGE')).toBe(true);
    });
  });

  describe('POST /api/prompts/:id/execute', () => {
    let promptId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Executable Prompt',
          content: 'Generate a test image',
          type: 'IMAGE',
          parameters: {
            size: '1024x1024',
          },
        });

      promptId = createResponse.body.id;
    });

    it('should execute a prompt', async () => {
      const response = await request(app)
        .post(`/api/prompts/${promptId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parameters: {
            quality: 'hd',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('pending');
    });

    it('should fail with non-existent prompt', async () => {
      const response = await request(app)
        .post('/api/prompts/non-existent/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/prompts/:id', () => {
    let promptId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Prompt',
          content: 'Original content',
          type: 'IMAGE',
        });

      promptId = createResponse.body.id;
    });

    it('should update a prompt', async () => {
      const response = await request(app)
        .put(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Prompt',
          content: 'Updated content',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Prompt');
      expect(response.body.content).toBe('Updated content');
      expect(response.body.version).toBe(2);
    });
  });

  describe('DELETE /api/prompts/:id', () => {
    let promptId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'To Delete',
          content: 'Will be deleted',
          type: 'IMAGE',
        });

      promptId = createResponse.body.id;
    });

    it('should delete a prompt', async () => {
      const response = await request(app)
        .delete(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});