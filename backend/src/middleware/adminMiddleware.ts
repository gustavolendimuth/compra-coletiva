/**
 * Admin Middleware
 * Middleware para proteger rotas admin e fazer log de ações
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { AuditAction, AuditTargetType, Prisma } from '@prisma/client';
import { AuditService } from '../services/auditService';

/**
 * Middleware que verifica se o usuário é admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError(401, 'Não autenticado');
  }

  if (req.user.role !== 'ADMIN') {
    throw new AppError(403, 'Acesso negado. Apenas administradores podem acessar este recurso.');
  }

  next();
};

/**
 * Middleware factory que faz log automático de ações admin
 */
export const logAdminAction = (action: AuditAction, targetType: AuditTargetType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to log after successful response
    res.json = ((body: unknown) => {
      // Extract targetId from params or body
      const targetId = req.params.id || req.body?.id || req.body?.targetId;

      // Log the action asynchronously (don't wait)
      AuditService.log(
        req.user!.id,
        action,
        targetType,
        targetId,
        toInputJsonValue({
          method: req.method,
          path: req.path,
          query: req.query,
          body: sanitizeBody(req.body),
        }),
        req
      ).catch((error) => {
        console.error('Erro ao registrar log de auditoria:', error);
      });

      return originalJson(body);
    }) as Response["json"];

    next();
  };
};

/**
 * Remove campos sensíveis do body antes de logar
 */
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'refreshToken'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

/**
 * Middleware combinado: requireAuth + requireAdmin + logAction
 */
export const adminAuth = (action: AuditAction, targetType: AuditTargetType) => {
  return [requireAdmin, logAdminAction(action, targetType)];
};
