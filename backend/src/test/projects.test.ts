import request from 'supertest';
import { app } from '../app';
import { createAuthenticatedUser } from './setup';

describe('Projects API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const { accessToken, user } = await createAuthenticatedUser();
    authToken = accessToken;
    userId = user.id;
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'A test project for unit testing',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Project');
      expect(response.body.description).toBe('A test project for unit testing');
      expect(response.body.userId).toBe(userId);
    });

    it('should fail without name', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create test projects
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Project 1' });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Project 2' });
    });

    it('should get all projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should search projects', async () => {
      const response = await request(app)
        .get('/api/projects?search=Project 1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Project 1');
    });
  });

  describe('Project Assets', () => {
    let projectId: string;
    let assetId: string;

    beforeEach(async () => {
      // Create project
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Asset Test Project' });

      projectId = projectResponse.body.id;

      // Create asset
      const assetResponse = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test'), 'test.txt')
        .field('tags', 'test');

      assetId = assetResponse.body.id;
    });

    it('should add asset to project', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/assets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetId });

      expect(response.status).toBe(201);
    });

    it('should get project assets', async () => {
      // First add asset
      await request(app)
        .post(`/api/projects/${projectId}/assets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetId });

      const response = await request(app)
        .get(`/api/projects/${projectId}/assets`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(assetId);
    });

    it('should remove asset from project', async () => {
      // First add asset
      await request(app)
        .post(`/api/projects/${projectId}/assets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetId });

      const response = await request(app)
        .delete(`/api/projects/${projectId}/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify removal
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}/assets`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.data.length).toBe(0);
    });
  });

  describe('POST /api/projects/:id/duplicate', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Project',
          description: 'To be duplicated',
        });

      projectId = response.body.id;
    });

    it('should duplicate a project', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body.name).toMatch(/Original Project \(Copy\)/);
      expect(response.body.description).toBe('To be duplicated');
      expect(response.body.id).not.toBe(projectId);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Delete' });

      projectId = response.body.id;
    });

    it('should delete a project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});