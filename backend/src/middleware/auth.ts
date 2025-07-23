import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../utils/jwt';
import { AppError } from './errorHandler';
import { ErrorCodes } from '../types';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, ErrorCodes.UNAUTHORIZED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = jwtService.verifyAccessToken(token);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      throw new AppError('User not found', 401, ErrorCodes.UNAUTHORIZED);
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof Error) {
      if (error.message === 'Access token expired') {
        next(new AppError('Token expired', 401, ErrorCodes.TOKEN_EXPIRED));
      } else if (error.message === 'Invalid access token') {
        next(new AppError('Invalid token', 401, ErrorCodes.UNAUTHORIZED));
      } else {
        next(new AppError('Authentication failed', 401, ErrorCodes.UNAUTHORIZED));
      }
    } else {
      next(new AppError('Authentication failed', 401, ErrorCodes.UNAUTHORIZED));
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, username: true },
    });

    if (user) {
      req.user = {
        userId: user.id,
        email: user.email,
        username: user.username,
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};