import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { jwtService } from '../utils/jwt';
import { CreateUserDto, LoginDto } from '../types/models';
import { AppError } from '../middleware/errorHandler';
import { ErrorCodes } from '../types';

export class AuthService {
  async register(data: CreateUserDto) {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError('Email already registered', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new AppError('Username already taken', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = jwtService.generateTokenPair(user);

    return {
      user,
      ...tokens,
    };
  }

  async login(data: LoginDto) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const tokens = jwtService.generateTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = jwtService.verifyRefreshToken(refreshToken);

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
      }

      // Generate new access token
      const accessToken = jwtService.generateAccessToken(user);

      return {
        accessToken,
        refreshToken, // Return the same refresh token
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Refresh token expired') {
          throw new AppError('Refresh token expired', 401, ErrorCodes.TOKEN_EXPIRED);
        }
        if (error.message === 'Invalid refresh token') {
          throw new AppError('Invalid refresh token', 401, ErrorCodes.UNAUTHORIZED);
        }
      }
      throw error;
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        _count: {
          select: {
            assets: true,
            prompts: true,
            projects: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    return user;
  }
}

export const authService = new AuthService();