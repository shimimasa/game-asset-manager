import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';
import { ErrorCodes } from '../types';

// Create Redis client for rate limiting
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

// General API rate limiter
const apiLimiter = redisClient
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:api',
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 60, // Block for 1 minute
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:api',
      points: 100,
      duration: 60,
      blockDuration: 60,
    });

// Strict rate limiter for auth endpoints
const authLimiter = redisClient
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:auth',
      points: 5, // 5 attempts
      duration: 900, // Per 15 minutes
      blockDuration: 900, // Block for 15 minutes
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:auth',
      points: 5,
      duration: 900,
      blockDuration: 900,
    });

// AI generation rate limiter
const generationLimiter = redisClient
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:generation',
      points: 10, // 10 generations
      duration: 3600, // Per hour
      blockDuration: 3600, // Block for 1 hour
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:generation',
      points: 10,
      duration: 3600,
      blockDuration: 3600,
    });

// File upload rate limiter
const uploadLimiter = redisClient
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:upload',
      points: 50, // 50 uploads
      duration: 3600, // Per hour
      blockDuration: 600, // Block for 10 minutes
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:upload',
      points: 50,
      duration: 3600,
      blockDuration: 600,
    });

// Helper to get client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// General API rate limiting middleware
export async function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = getClientIp(req);
    await apiLimiter.consume(ip);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.set('X-RateLimit-Limit', String(apiLimiter.points));
    res.set('X-RateLimit-Remaining', String(rejRes.remainingPoints || 0));
    res.set('X-RateLimit-Reset', new Date(Date.now() + rejRes.msBeforeNext).toISOString());
    
    next(new AppError(
      'Too many requests, please try again later',
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED
    ));
  }
}

// Auth endpoints rate limiting
export async function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = getClientIp(req);
    const key = `${ip}:${req.path}`;
    await authLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const mins = Math.round(rejRes.msBeforeNext / 1000 / 60) || 1;
    res.set('Retry-After', String(rejRes.msBeforeNext / 1000));
    
    next(new AppError(
      `Too many authentication attempts. Please try again in ${mins} minutes`,
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED
    ));
  }
}

// AI generation rate limiting
export async function generationRateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED));
    }
    
    const key = `user:${req.user.userId}`;
    await generationLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const mins = Math.round(rejRes.msBeforeNext / 1000 / 60) || 1;
    res.set('Retry-After', String(rejRes.msBeforeNext / 1000));
    res.set('X-RateLimit-Limit', String(generationLimiter.points));
    res.set('X-RateLimit-Remaining', String(rejRes.remainingPoints || 0));
    
    next(new AppError(
      `Generation limit exceeded. You can generate ${generationLimiter.points} items per hour. Please try again in ${mins} minutes`,
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED
    ));
  }
}

// File upload rate limiting
export async function uploadRateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED));
    }
    
    const key = `user:${req.user.userId}`;
    await uploadLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const mins = Math.round(rejRes.msBeforeNext / 1000 / 60) || 1;
    res.set('Retry-After', String(rejRes.msBeforeNext / 1000));
    
    next(new AppError(
      `Upload limit exceeded. You can upload ${uploadLimiter.points} files per hour. Please try again in ${mins} minutes`,
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED
    ));
  }
}

// Brute force protection for login attempts
const loginAttempts = new Map<string, number>();
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

export function loginBruteForceProtection(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const username = req.body.username || req.body.email;
  const key = `${ip}:${username}`;
  
  const attempts = loginAttempts.get(key) || 0;
  
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    return next(new AppError(
      'Account temporarily locked due to too many failed login attempts',
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED
    ));
  }
  
  // Clean up old attempts
  setTimeout(() => {
    loginAttempts.delete(key);
  }, LOGIN_ATTEMPT_WINDOW);
  
  // Store original json method
  const originalJson = res.json;
  
  // Override json to track failed attempts
  res.json = function(data: any) {
    if (res.statusCode === 401 || res.statusCode === 400) {
      loginAttempts.set(key, attempts + 1);
    } else if (res.statusCode === 200) {
      loginAttempts.delete(key);
    }
    return originalJson.call(this, data);
  };
  
  next();
}