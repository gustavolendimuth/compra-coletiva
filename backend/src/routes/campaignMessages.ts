import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireCampaignOwnership } from '../middleware/authMiddleware';
import { SpamDetectionService } from '../services/spamDetectionService';
import {
  emitCampaignQuestionReceived,
  emitCampaignMessagePublished,
  emitCampaignMessageEdited,
  emitCampaignMessageDeleted
} from '../services/socketService';

const router = Router();

// ========== SCHEMAS DE VALIDAÇÃO ==========

const createQuestionSchema = z.object({
  campaignId: z.string(),
  question: z.string()
    .min(1, 'A pergunta não pode estar vazia')
    .max(1000, 'A pergunta excede o limite de 1000 caracteres')
    .refine(msg => msg.trim().length >= 3, 'A pergunta é muito curta')
    .refine(msg => !/(.)\1{10,}/.test(msg), 'Caracteres repetidos detectados')
    .refine(msg => (msg.match(/https?:\/\//g) || []).length <= 2, 'Muitos links na mensagem')
});

const editQuestionSchema = z.object({
  question: z.string()
    .min(1, 'A pergunta não pode estar vazia')
    .max(1000, 'A pergunta excede o limite de 1000 caracteres')
    .refine(msg => msg.trim().length >= 3, 'A pergunta é muito curta')
});

const answerQuestionSchema = z.object({
  answer: z.string()
    .min(1, 'A resposta não pode estar vazia')
    .max(2000, 'A resposta excede o limite de 2000 caracteres')
});

// ========== ROTAS PÚBLICAS ==========

/**
 * GET /api/campaign-messages?campaignId=xxx&limit=20&offset=0
 * Retorna perguntas e respostas públicas (isPublic=true) de uma campanha
 * Não requer autenticação
 */
router.get('/', asyncHandler(async (req, res) => {
  const { campaignId, limit = '20', offset = '0' } = req.query;

  if (!campaignId || typeof campaignId !== 'string') {
    throw new AppError(400, 'campaignId é obrigatório');
  }

  const limitNum = parseInt(limit as string, 10);
  const offsetNum = parseInt(offset as string, 10);

  if (isNaN(limitNum) || isNaN(offsetNum) || limitNum < 1 || limitNum > 100) {
    throw new AppError(400, 'Parâmetros de paginação inválidos');
  }

  const [messages, total] = await Promise.all([
    prisma.campaignMessage.findMany({
      where: {
        campaignId,
        isPublic: true
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        },
        answerer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offsetNum,
      take: limitNum
    }),
    prisma.campaignMessage.count({
      where: {
        campaignId,
        isPublic: true
      }
    })
  ]);

  res.json({
    messages,
    total,
    hasMore: offsetNum + messages.length < total
  });
}));

// ========== ROTAS AUTENTICADAS ==========

/**
 * POST /api/campaign-messages
 * Cria uma nova pergunta
 * Requer autenticação
 */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const data = createQuestionSchema.parse(req.body);
  const userId = req.user!.id;

  // Verificar se a campanha existe
  const campaign = await prisma.campaign.findUnique({
    where: { id: data.campaignId },
    select: { id: true, creatorId: true, name: true }
  });

  if (!campaign) {
    throw new AppError(404, 'Campanha não encontrada');
  }

  // Verificar rate limits
  const rateLimitResult = await SpamDetectionService.checkRateLimit(
    userId,
    data.campaignId
  );

  if (!rateLimitResult.allowed) {
    const retryMessage = rateLimitResult.retryAfter
      ? ` Tente novamente em ${Math.ceil(rateLimitResult.retryAfter / 60)} minuto(s).`
      : '';

    throw new AppError(
      429,
      `Limite de perguntas excedido.${retryMessage}`
    );
  }

  // Calcular spam score
  const spamAnalysis = await SpamDetectionService.calculateSpamScore(
    userId,
    data.question,
    data.campaignId
  );

  // Criar mensagem
  const message = await prisma.campaignMessage.create({
    data: {
      campaignId: data.campaignId,
      senderId: userId,
      question: data.question.trim(),
      spamScore: spamAnalysis.score,
      metadata: {
        factors: spamAnalysis.factors
      },
      isPublic: false
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Atualizar lastMessageAt do usuário
  await prisma.user.update({
    where: { id: userId },
    data: { lastMessageAt: new Date() }
  });

  // Emitir evento Socket.IO para o criador da campanha
  if (campaign.creatorId) {
    emitCampaignQuestionReceived(campaign.creatorId, data.campaignId, {
      messageId: message.id,
      question: message.question,
      sender: message.sender,
      spamScore: message.spamScore,
      createdAt: message.createdAt
    });
  }

  // Calcular quando pode editar (15 minutos)
  const canEditUntil = new Date(message.createdAt.getTime() + 15 * 60 * 1000);

  res.status(201).json({
    message,
    canEditUntil,
    spamScore: spamAnalysis.score
  });
}));

/**
 * PATCH /api/campaign-messages/:id
 * Edita uma pergunta própria (apenas se não foi respondida e dentro de 15 min)
 * Requer autenticação
 */
router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = editQuestionSchema.parse(req.body);
  const userId = req.user!.id;

  // Buscar mensagem
  const message = await prisma.campaignMessage.findUnique({
    where: { id },
    include: {
      campaign: {
        select: { creatorId: true }
      }
    }
  });

  if (!message) {
    throw new AppError(404, 'Mensagem não encontrada');
  }

  // Verificar permissões
  if (message.senderId !== userId) {
    throw new AppError(403, 'Você não pode editar esta pergunta');
  }

  // Verificar se já foi respondida
  if (message.answer !== null) {
    throw new AppError(400, 'Não é possível editar uma pergunta já respondida');
  }

  // Verificar janela de edição (15 minutos)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (message.createdAt < fifteenMinutesAgo) {
    throw new AppError(400, 'O prazo para edição expirou (15 minutos)');
  }

  // Atualizar mensagem
  const updatedMessage = await prisma.campaignMessage.update({
    where: { id },
    data: {
      question: data.question.trim(),
      isEdited: true,
      editedAt: new Date()
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Emitir evento para o criador
  if (message.campaign.creatorId) {
    emitCampaignMessageEdited(message.campaign.creatorId, message.campaignId, updatedMessage);
  }

  res.json(updatedMessage);
}));

/**
 * GET /api/campaign-messages/mine?campaignId=xxx
 * Retorna as próprias perguntas (respondidas e não respondidas)
 * Requer autenticação
 */
router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const { campaignId } = req.query;
  const userId = req.user!.id;

  if (!campaignId || typeof campaignId !== 'string') {
    throw new AppError(400, 'campaignId é obrigatório');
  }

  const messages = await prisma.campaignMessage.findMany({
    where: {
      campaignId,
      senderId: userId
    },
    include: {
      answerer: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(messages);
}));

// ========== ROTAS DO CRIADOR ==========

/**
 * GET /api/campaign-messages/unanswered?campaignId=xxx
 * Retorna perguntas não respondidas (para moderação)
 * Requer ser criador da campanha
 */
router.get('/unanswered', requireAuth, asyncHandler(async (req, res) => {
  const { campaignId } = req.query;
  const userId = req.user!.id;

  if (!campaignId || typeof campaignId !== 'string') {
    throw new AppError(400, 'campaignId é obrigatório');
  }

  // Verificar se é o criador
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { creatorId: true }
  });

  if (!campaign || campaign.creatorId !== userId) {
    throw new AppError(403, 'Apenas o criador da campanha pode acessar esta rota');
  }

  const messages = await prisma.campaignMessage.findMany({
    where: {
      campaignId,
      answer: null // Não respondidas
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          orders: {
            where: { campaignId },
            select: { id: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(messages);
}));

/**
 * PATCH /api/campaign-messages/:id/answer
 * Responde uma pergunta (publica automaticamente)
 * Requer ser criador da campanha
 */
router.patch('/:id/answer', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = answerQuestionSchema.parse(req.body);
  const userId = req.user!.id;

  // Buscar mensagem
  const message = await prisma.campaignMessage.findUnique({
    where: { id },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          creatorId: true
        }
      },
      sender: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!message) {
    throw new AppError(404, 'Mensagem não encontrada');
  }

  // Verificar se é o criador
  if (message.campaign.creatorId !== userId) {
    throw new AppError(403, 'Apenas o criador da campanha pode responder perguntas');
  }

  // Verificar se já foi respondida
  if (message.answer !== null) {
    throw new AppError(400, 'Esta pergunta já foi respondida');
  }

  // Atualizar mensagem (publicar)
  const updatedMessage = await prisma.campaignMessage.update({
    where: { id },
    data: {
      answer: data.answer.trim(),
      answeredAt: new Date(),
      answeredBy: userId,
      isPublic: true
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true
        }
      },
      answerer: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Atualizar reputação do usuário que perguntou
  await SpamDetectionService.updateUserReputation(message.senderId);

  // Incrementar answeredCount do criador
  await prisma.user.update({
    where: { id: userId },
    data: { answeredCount: { increment: 1 } }
  });

  // Emitir evento para todos na campanha
  emitCampaignMessagePublished(message.campaignId, {
    messageId: updatedMessage.id,
    question: updatedMessage.question,
    answer: updatedMessage.answer!,
    sender: updatedMessage.sender,
    answerer: updatedMessage.answerer!,
    answeredAt: updatedMessage.answeredAt!,
    createdAt: updatedMessage.createdAt
  });

  res.json(updatedMessage);
}));

/**
 * DELETE /api/campaign-messages/:id
 * Deleta uma pergunta (spam)
 * Requer ser criador da campanha
 */
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Buscar mensagem
  const message = await prisma.campaignMessage.findUnique({
    where: { id },
    include: {
      campaign: {
        select: { creatorId: true }
      }
    }
  });

  if (!message) {
    throw new AppError(404, 'Mensagem não encontrada');
  }

  // Verificar se é o criador
  if (message.campaign.creatorId !== userId) {
    throw new AppError(403, 'Apenas o criador da campanha pode deletar perguntas');
  }

  // Penalizar usuário que enviou spam
  if (message.spamScore > 50) {
    await SpamDetectionService.penalizeUser(message.senderId, 20);
  }

  // Deletar mensagem
  await prisma.campaignMessage.delete({
    where: { id }
  });

  // Emitir evento
  emitCampaignMessageDeleted(message.campaignId, { messageId: id });

  res.status(204).send();
}));

export default router;
