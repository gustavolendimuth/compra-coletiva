/**
 * Audit Service
 * Serviço para gerenciar logs de auditoria
 */

import { Request } from 'express';
import { prisma } from '../index';
import { AuditAction, AuditTargetType, AuditLog, Prisma } from '@prisma/client';

export interface AuditLogSearchFilters {
  adminId?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AuditService {
  /**
   * Registra uma ação de auditoria
   */
  static async log(
    adminId: string,
    action: AuditAction,
    targetType: AuditTargetType,
    targetId?: string,
    details?: Prisma.InputJsonValue,
    req?: Request
  ): Promise<AuditLog> {
    const ipAddress = req ? this.getClientIp(req) : undefined;
    const userAgent = req?.headers['user-agent'];

    return await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: details || {},
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Busca logs de auditoria com filtros e paginação
   */
  static async search(filters: AuditLogSearchFilters): Promise<PaginatedAuditLogs> {
    const {
      adminId,
      action,
      targetType,
      targetId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: Prisma.AuditLogWhereInput = {};

    if (adminId) where.adminId = adminId;
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca um log específico por ID
   */
  static async findById(id: string): Promise<AuditLog | null> {
    return await prisma.auditLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Busca logs de um admin específico
   */
  static async findByAdmin(adminId: string, limit = 50): Promise<AuditLog[]> {
    return await prisma.auditLog.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Busca logs de um target específico
   */
  static async findByTarget(
    targetType: AuditTargetType,
    targetId: string,
    limit = 50
  ): Promise<AuditLog[]> {
    return await prisma.auditLog.findMany({
      where: { targetType, targetId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Estatísticas de auditoria
   */
  static async getStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.AuditLogWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, byAction, byAdmin] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['adminId'],
        where,
        _count: true,
        orderBy: { _count: { adminId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count,
      })),
      topAdmins: await Promise.all(
        byAdmin.map(async (item) => {
          const admin = await prisma.user.findUnique({
            where: { id: item.adminId || undefined },
            select: { id: true, name: true, email: true },
          });
          return {
            admin,
            count: item._count,
          };
        })
      ),
    };
  }

  /**
   * Extrai o IP do cliente da request
   */
  private static getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }
}
