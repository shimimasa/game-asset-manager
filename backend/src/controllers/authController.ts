import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { CreateUserDto, LoginDto } from '../types/models';
import { auditService, AuditAction } from '../services/auditService';
import { validatePasswordStrength } from '../middleware/security';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateUserDto = req.body;
      
      // Validate password strength
      const passwordErrors = validatePasswordStrength(data.password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: passwordErrors,
        });
      }
      
      const result = await authService.register(data);
      
      // Log successful registration
      await auditService.logRequest(req as AuthRequest, AuditAction.USER_REGISTER, {
        userId: result.user.id,
        metadata: { username: result.user.username },
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Log failed registration attempt
      await auditService.logFailure(
        req as AuthRequest,
        AuditAction.USER_REGISTER,
        error.message,
        { metadata: { username: req.body.username } }
      );
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data: LoginDto = req.body;
      const result = await authService.login(data);
      
      // Log successful login
      await auditService.logRequest(req as AuthRequest, AuditAction.USER_LOGIN, {
        userId: result.user.id,
        metadata: { username: result.user.username },
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Log failed login attempt
      await auditService.logFailure(
        req as AuthRequest,
        AuditAction.LOGIN_FAILED,
        error.message,
        { metadata: { username: req.body.email } }
      );
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const profile = await authService.getProfile(req.user.userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Log logout
      if ((req as AuthRequest).user) {
        await auditService.logRequest(req as AuthRequest, AuditAction.USER_LOGOUT);
      }
      
      // Since we're using stateless JWT, we just return success
      // The client should remove the tokens
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();