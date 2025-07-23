import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export enum AuditAction {
  // Auth actions
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  
  // Asset actions
  ASSET_UPLOAD = 'ASSET_UPLOAD',
  ASSET_UPDATE = 'ASSET_UPDATE',
  ASSET_DELETE = 'ASSET_DELETE',
  ASSET_DOWNLOAD = 'ASSET_DOWNLOAD',
  
  // Prompt actions
  PROMPT_CREATE = 'PROMPT_CREATE',
  PROMPT_UPDATE = 'PROMPT_UPDATE',
  PROMPT_DELETE = 'PROMPT_DELETE',
  PROMPT_EXECUTE = 'PROMPT_EXECUTE',
  
  // Project actions
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',
  PROJECT_DUPLICATE = 'PROJECT_DUPLICATE',
  
  // Export actions
  EXPORT_CREATE = 'EXPORT_CREATE',
  EXPORT_DOWNLOAD = 'EXPORT_DOWNLOAD',
  
  // Security actions
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
}

export interface AuditLogData {
  action: AuditAction;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

export class AuditService {
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          userId: data.userId,
          resourceId: data.resourceId,
          resourceType: data.resourceType,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata || {},
          success: data.success,
          errorMessage: data.errorMessage,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Log to console if database logging fails
      console.error('Failed to write audit log:', error);
      console.log('Audit log data:', data);
    }
  }

  async logRequest(req: AuthRequest, action: AuditAction, data: Partial<AuditLogData> = {}) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || undefined;
    
    await this.log({
      action,
      userId: req.user?.userId,
      ipAddress,
      userAgent,
      success: true,
      ...data,
    });
  }

  async logFailure(req: AuthRequest, action: AuditAction, error: string, data: Partial<AuditLogData> = {}) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || undefined;
    
    await this.log({
      action,
      userId: req.user?.userId,
      ipAddress,
      userAgent,
      success: false,
      errorMessage: error,
      ...data,
    });
  }

  private getClientIp(req: AuthRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  // Query methods for security monitoring
  async getRecentFailedLogins(minutes: number = 15): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    
    return prisma.auditLog.count({
      where: {
        action: AuditAction.LOGIN_FAILED,
        timestamp: {
          gte: since,
        },
      },
    });
  }

  async getSuspiciousActivity(userId?: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const where: any = {
      timestamp: {
        gte: since,
      },
      OR: [
        { action: AuditAction.SUSPICIOUS_ACTIVITY },
        { action: AuditAction.UNAUTHORIZED_ACCESS },
        { action: AuditAction.RATE_LIMIT_EXCEEDED },
      ],
    };

    if (userId) {
      where.userId = userId;
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    });
  }

  async getUserActivity(userId: string, days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 500,
    });
  }

  // Cleanup old logs
  async cleanupOldLogs(days: number = 90) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoff,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old audit logs`);
    return result.count;
  }
}

export const auditService = new AuditService();