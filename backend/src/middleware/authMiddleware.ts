import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { TokenService } from '../services/tokenService';

const prisma = new PrismaClient();

/**
 * Middleware que verifica se o usuário está autenticado
 * Anexa o usuário à requisição se o token for válido
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extrai token do header
    const token = TokenService.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token de autenticação não fornecido',
      });
      return;
    }

    // Verifica e decodifica token
    let payload;
    try {
      payload = TokenService.verifyAccessToken(token);
    } catch (error: any) {
      if (error.message === 'TOKEN_EXPIRED') {
        res.status(401).json({
          error: 'TOKEN_EXPIRED',
          message: 'Token expirado. Use o refresh token para obter um novo.',
        });
        return;
      }

      res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Token inválido',
      });
      return;
    }

    // Busca usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado',
      });
      return;
    }

    // Anexa usuário à requisição
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao processar autenticação',
    });
  }
};

/**
 * Middleware opcional de autenticação
 * Anexa o usuário se o token for válido, mas não bloqueia a requisição
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = TokenService.extractTokenFromHeader(req.headers.authorization);

    if (token) {
      try {
        const payload = TokenService.verifyAccessToken(token);
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });

        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Ignora erros de token em auth opcional
      }
    }

    next();
  } catch (error) {
    // Em caso de erro, apenas continua sem autenticar
    next();
  }
};

/**
 * Middleware que verifica se o usuário tem um dos roles especificados
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Autenticação necessária',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Você não tem permissão para acessar este recurso',
        requiredRoles: roles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware que verifica se o usuário é o criador da campanha ou admin
 */
export const requireCampaignOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Autenticação necessária',
      });
      return;
    }

    // Admin tem acesso total
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const campaignId = req.params.id || req.body.campaignId;

    if (!campaignId) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'ID da campanha não fornecido',
      });
      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorId: true },
    });

    if (!campaign) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Campanha não encontrada',
      });
      return;
    }

    if (campaign.creatorId !== req.user.id) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Você não tem permissão para modificar esta campanha',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar ownership da campanha:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao verificar permissões',
    });
  }
};

/**
 * Middleware que verifica se o usuário é o dono do pedido ou admin
 */
export const requireOrderOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Autenticação necessária',
      });
      return;
    }

    // Admin tem acesso total
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const orderId = req.params.id;

    if (!orderId) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'ID do pedido não fornecido',
      });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Pedido não encontrado',
      });
      return;
    }

    if (order.userId !== req.user.id) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Você não tem permissão para modificar este pedido',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar ownership do pedido:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao verificar permissões',
    });
  }
};

/**
 * Middleware que verifica se o usuário é o dono do pedido, criador da campanha ou admin
 * Usado para operações que criadores de campanha precisam realizar em pedidos (como marcar como pago)
 */
export const requireOrderOrCampaignOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Autenticação necessária',
      });
      return;
    }

    // Admin tem acesso total
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const orderId = req.params.id;

    if (!orderId) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'ID do pedido não fornecido',
      });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        campaign: {
          select: { creatorId: true },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Pedido não encontrado',
      });
      return;
    }

    // Permite se o usuário é o dono do pedido OU criador da campanha
    const isOrderOwner = order.userId === req.user.id;
    const isCampaignCreator = order.campaign.creatorId === req.user.id;

    if (!isOrderOwner && !isCampaignCreator) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Você não tem permissão para modificar este pedido',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar ownership do pedido/campanha:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao verificar permissões',
    });
  }
};

/**
 * Middleware que verifica se o usuário tem acesso às mensagens de um pedido
 * (Dono do pedido ou criador da campanha)
 */
export const requireMessageAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Autenticação necessária',
      });
      return;
    }

    // Admin tem acesso total
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const orderId = req.query.orderId as string || req.body.orderId;

    if (!orderId) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'ID do pedido não fornecido',
      });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        campaign: {
          select: { creatorId: true },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Pedido não encontrado',
      });
      return;
    }

    // Verifica se é o dono do pedido ou criador da campanha
    const isOrderOwner = order.userId === req.user.id;
    const isCampaignCreator = order.campaign.creatorId === req.user.id;

    if (!isOrderOwner && !isCampaignCreator) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Você não tem acesso às mensagens deste pedido',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar acesso às mensagens:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao verificar permissões',
    });
  }
};
