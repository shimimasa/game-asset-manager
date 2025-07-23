import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
}

interface AccessTokenPayload extends TokenPayload {
  type: 'access';
}

export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_SECRET + '_refresh';
    this.accessTokenExpiry = process.env.JWT_EXPIRE_TIME || '15m';
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRE_TIME || '7d';
  }

  generateAccessToken(user: Pick<User, 'id' | 'email' | 'username'>): string {
    const payload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      type: 'access',
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });
  }

  generateRefreshToken(user: Pick<User, 'id' | 'email' | 'username'>): string {
    const payload: RefreshTokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      type: 'refresh',
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    });
  }

  generateTokenPair(user: Pick<User, 'id' | 'email' | 'username'>) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as AccessTokenPayload;
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret) as RefreshTokenPayload;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }
}

export const jwtService = new JWTService();