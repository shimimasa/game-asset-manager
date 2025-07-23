import { app } from '../app';
import request from 'supertest';

describe('API Health Check', () => {
  it('should return 200 OK for health endpoint', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});