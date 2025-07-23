import request from 'supertest';
import { app } from '../app';
import { createAuthenticatedUser } from './setup';
import path from 'path';
import fs from 'fs';

describe('Assets API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const { accessToken, user } = await createAuthenticatedUser();
    authToken = accessToken;
    userId = user.id;
  });

  describe('POST /api/assets/upload', () => {
    it('should upload an image asset', async () => {
      const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png');
      
      // Create test image if it doesn't exist
      if (!fs.existsSync(testImagePath)) {
        const dir = path.dirname(testImagePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        // Create a minimal PNG file
        const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(testImagePath, pngBuffer);
      }

      const response = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath)
        .field('tags', 'test,image')
        .field('category', 'TEST');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('filename');
      expect(response.body.fileType).toBe('IMAGE');
      expect(response.body.tags).toEqual(['test', 'image']);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/assets/upload');

      expect(response.status).toBe(401);
    });

    it('should fail without file', async () => {
      const response = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('tags', 'test');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/assets', () => {
    it('should get paginated assets', async () => {
      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by file type', async () => {
      const response = await request(app)
        .get('/api/assets?fileType=IMAGE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((asset: any) => asset.fileType === 'IMAGE')).toBe(true);
    });

    it('should search by query', async () => {
      const response = await request(app)
        .get('/api/assets?search=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/assets/:id', () => {
    it('should get asset details', async () => {
      // First create an asset
      const createResponse = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test'), 'test.txt')
        .field('tags', 'test');

      const assetId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(assetId);
    });

    it('should fail with non-existent asset', async () => {
      const response = await request(app)
        .get('/api/assets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/assets/:id', () => {
    it('should update asset metadata', async () => {
      // First create an asset
      const createResponse = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test'), 'test.txt')
        .field('tags', 'test');

      const assetId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tags: ['updated', 'tags'],
          category: 'UPDATED',
        });

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(['updated', 'tags']);
      expect(response.body.category).toBe('UPDATED');
    });
  });

  describe('DELETE /api/assets/:id', () => {
    it('should delete an asset', async () => {
      // First create an asset
      const createResponse = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test'), 'test.txt')
        .field('tags', 'test');

      const assetId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});