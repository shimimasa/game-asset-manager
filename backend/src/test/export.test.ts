import request from 'supertest';
import { app } from '../app';
import { createAuthenticatedUser } from './setup';

describe('Export API', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;
  let assetIds: string[] = [];

  beforeEach(async () => {
    const { accessToken, user } = await createAuthenticatedUser();
    authToken = accessToken;
    userId = user.id;

    // Create a project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Export Test Project' });

    projectId = projectResponse.body.id;

    // Create some assets
    for (let i = 0; i < 3; i++) {
      const assetResponse = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(`test content ${i}`), `test${i}.txt`)
        .field('tags', 'test,export');

      assetIds.push(assetResponse.body.id);

      // Add to project
      await request(app)
        .post(`/api/projects/${projectId}/assets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetId: assetResponse.body.id });
    }
  });

  describe('POST /api/export/asset/:id', () => {
    it('should export single asset as ZIP', async () => {
      const response = await request(app)
        .post(`/api/export/asset/${assetIds[0]}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'ZIP',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('status');
      expect(response.body.format).toBe('ZIP');
    });

    it('should export single asset as WEBP', async () => {
      const response = await request(app)
        .post(`/api/export/asset/${assetIds[0]}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'WEBP',
          quality: 85,
        });

      expect(response.status).toBe(200);
      expect(response.body.format).toBe('WEBP');
      expect(response.body.quality).toBe(85);
    });

    it('should fail with non-existent asset', async () => {
      const response = await request(app)
        .post('/api/export/asset/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'ZIP' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/export/assets', () => {
    it('should export multiple assets', async () => {
      const response = await request(app)
        .post('/api/export/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetIds: assetIds.slice(0, 2),
          format: 'ZIP',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobId');
    });

    it('should fail with empty asset list', async () => {
      const response = await request(app)
        .post('/api/export/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetIds: [],
          format: 'ZIP',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/export/project/:id', () => {
    it('should export entire project', async () => {
      const response = await request(app)
        .post(`/api/export/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'ZIP',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobId');
    });

    it('should export selected project assets', async () => {
      const response = await request(app)
        .post(`/api/export/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'ZIP',
          assetIds: assetIds.slice(0, 2),
        });

      expect(response.status).toBe(200);
    });

    it('should fail with non-existent project', async () => {
      const response = await request(app)
        .post('/api/export/project/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'ZIP' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/export/status/:jobId', () => {
    let jobId: string;

    beforeEach(async () => {
      const exportResponse = await request(app)
        .post(`/api/export/asset/${assetIds[0]}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'ZIP' });

      jobId = exportResponse.body.jobId;
    });

    it('should get export job status', async () => {
      const response = await request(app)
        .get(`/api/export/status/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(['pending', 'processing', 'completed', 'failed']).toContain(response.body.status);
    });

    it('should fail with non-existent job', async () => {
      const response = await request(app)
        .get('/api/export/status/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/export/history', () => {
    it('should get export history', async () => {
      // Create some export jobs
      await request(app)
        .post(`/api/export/asset/${assetIds[0]}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'ZIP' });

      const response = await request(app)
        .get('/api/export/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should limit history results', async () => {
      const response = await request(app)
        .get('/api/export/history?limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });
});