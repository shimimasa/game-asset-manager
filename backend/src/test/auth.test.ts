import request from 'supertest';
import { app } from '../app';
import { testUser, createAuthenticatedUser } from './setup';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'NewPass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.username).toBe('newuser');
      expect(response.body.user.email).toBe('new@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail with duplicate username', async () => {
      await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: 'another@example.com',
          password: 'AnotherPass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'invalid-email',
          password: 'NewPass123!',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should login with email', async () => {
      await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
    });

    it('should fail with invalid password', async () => {
      await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'SomePassword123!',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const { refreshToken } = await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});