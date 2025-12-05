import { prisma } from '../index';

export interface SpamFactor {
  name: string;
  value: number | boolean;
  weight: number;
  description: string;
}

export interface SpamAnalysis {
  score: number;
  factors: SpamFactor[];
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  globalLimit: { current: number; max: number };
  campaignLimit: { current: number; max: number };
  burstLimit: { current: number; max: number };
}

export class SpamDetectionService {
  /**
   * Calcula a pontuação de spam (0-100) para uma pergunta
   * Maior pontuação = maior probabilidade de spam
   */
  static async calculateSpamScore(
    userId: string,
    question: string,
    campaignId?: string
  ): Promise<SpamAnalysis> {
    const factors: SpamFactor[] = [];
    let totalScore = 0;

    // Buscar informações do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        spamScore: true,
        orders: {
          select: { id: true },
          ...(campaignId && { where: { campaignId } })
        },
        sentCampaignMessages: {
          where: {
            isPublic: false, // Mensagens não respondidas (possível spam)
            ...(campaignId && { campaignId })
          },
          select: { id: true }
        }
      }
    });

    if (!user) {
      return { score: 100, factors: [] }; // Usuário não encontrado = spam
    }

    // Fator 1: Contagem de URLs
    const urlMatches = question.match(/https?:\/\/[^\s]+/g) || [];
    const urlCount = urlMatches.length;
    if (urlCount > 0) {
      const urlWeight = Math.min(urlCount * 10, 30); // Máximo 30 pontos
      totalScore += urlWeight;
      factors.push({
        name: 'URLs',
        value: urlCount,
        weight: urlWeight,
        description: `Contém ${urlCount} link${urlCount > 1 ? 's' : ''}`
      });
    }

    // Fator 2: Letras maiúsculas excessivas
    const totalLetters = question.replace(/[^a-zA-Z]/g, '').length;
    const upperCaseLetters = question.replace(/[^A-Z]/g, '').length;
    const capsRatio = totalLetters > 0 ? upperCaseLetters / totalLetters : 0;

    if (capsRatio > 0.5 && totalLetters > 10) {
      const capsWeight = 20;
      totalScore += capsWeight;
      factors.push({
        name: 'Maiúsculas excessivas',
        value: Math.round(capsRatio * 100),
        weight: capsWeight,
        description: `${Math.round(capsRatio * 100)}% do texto em maiúsculas`
      });
    }

    // Fator 3: Caracteres repetidos (ex: "aaaaa", "!!!!!!")
    const repeatPattern = /(.)\1{5,}/g;
    const repeatMatches = question.match(repeatPattern) || [];
    if (repeatMatches.length > 0) {
      const repeatWeight = Math.min(repeatMatches.length * 5, 15);
      totalScore += repeatWeight;
      factors.push({
        name: 'Caracteres repetidos',
        value: repeatMatches.length,
        weight: repeatWeight,
        description: `${repeatMatches.length} sequência${repeatMatches.length > 1 ? 's' : ''} de caracteres repetidos`
      });
    }

    // Fator 4: Conta nova (menos de 24 horas)
    const accountAge = Date.now() - user.createdAt.getTime();
    const isNewAccount = accountAge < 24 * 60 * 60 * 1000;

    if (isNewAccount) {
      const newAccountWeight = 15;
      totalScore += newAccountWeight;
      factors.push({
        name: 'Conta nova',
        value: Math.round(accountAge / (60 * 60 * 1000)), // Horas
        weight: newAccountWeight,
        description: `Conta criada há ${Math.round(accountAge / (60 * 60 * 1000))} hora(s)`
      });
    }

    // Fator 5: Sem pedidos na campanha
    const hasOrders = user.orders.length > 0;
    if (!hasOrders && campaignId) {
      const noOrdersWeight = 10;
      totalScore += noOrdersWeight;
      factors.push({
        name: 'Sem pedidos',
        value: 0,
        weight: noOrdersWeight,
        description: 'Nunca fez pedidos nesta campanha'
      });
    }

    // Fator 6: Histórico de spam (spamScore do usuário)
    if (user.spamScore > 50) {
      const historyWeight = 20;
      totalScore += historyWeight;
      factors.push({
        name: 'Histórico de spam',
        value: user.spamScore,
        weight: historyWeight,
        description: `Pontuação de spam do usuário: ${user.spamScore.toFixed(0)}`
      });
    }

    // Fator 7: Mensagens não respondidas (possível flood)
    const unansweredCount = user.sentCampaignMessages.length;
    if (unansweredCount > 3) {
      const unansweredWeight = Math.min((unansweredCount - 3) * 5, 15);
      totalScore += unansweredWeight;
      factors.push({
        name: 'Mensagens pendentes',
        value: unansweredCount,
        weight: unansweredWeight,
        description: `${unansweredCount} pergunta${unansweredCount > 1 ? 's' : ''} ainda sem resposta`
      });
    }

    // Fator 8: Palavras proibidas (lista básica)
    const prohibitedWords = ['viagra', 'casino', 'crypto', 'bitcoin', 'ganhe dinheiro', 'clique aqui'];
    const foundProhibited = prohibitedWords.filter(word =>
      question.toLowerCase().includes(word)
    );

    if (foundProhibited.length > 0) {
      const prohibitedWeight = 30;
      totalScore += prohibitedWeight;
      factors.push({
        name: 'Conteúdo proibido',
        value: foundProhibited.length,
        weight: prohibitedWeight,
        description: `Contém palavra${foundProhibited.length > 1 ? 's' : ''} proibida${foundProhibited.length > 1 ? 's' : ''}: ${foundProhibited.join(', ')}`
      });
    }

    // Limitar score a 100
    const finalScore = Math.min(totalScore, 100);

    return {
      score: finalScore,
      factors
    };
  }

  /**
   * Verifica os limites de taxa para um usuário
   * Retorna se o usuário pode enviar mais mensagens e quando pode tentar novamente
   */
  static async checkRateLimit(
    userId: string,
    campaignId: string
  ): Promise<RateLimitResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true }
    });

    // Usuários banidos não podem enviar mensagens
    if (user?.isBanned) {
      return {
        allowed: false,
        globalLimit: { current: 0, max: 0 },
        campaignLimit: { current: 0, max: 0 },
        burstLimit: { current: 0, max: 0 }
      };
    }

    const now = Date.now();

    // Limite global: 10 mensagens por hora
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const globalCount = await prisma.campaignMessage.count({
      where: {
        senderId: userId,
        createdAt: { gte: oneHourAgo }
      }
    });

    const globalMax = 10;
    const globalAllowed = globalCount < globalMax;

    // Limite por campanha: 1 mensagem a cada 2 minutos
    const twoMinutesAgo = new Date(now - 2 * 60 * 1000);
    const campaignCount = await prisma.campaignMessage.count({
      where: {
        senderId: userId,
        campaignId,
        createdAt: { gte: twoMinutesAgo }
      }
    });

    const campaignMax = 1;
    const campaignAllowed = campaignCount === 0;

    // Limite de burst: 3 mensagens por minuto (globalmente)
    const oneMinuteAgo = new Date(now - 60 * 1000);
    const burstCount = await prisma.campaignMessage.count({
      where: {
        senderId: userId,
        createdAt: { gte: oneMinuteAgo }
      }
    });

    const burstMax = 3;
    const burstAllowed = burstCount < burstMax;

    // Calcular quando o usuário pode tentar novamente
    let retryAfter: number | undefined;

    if (!campaignAllowed) {
      // Se bloqueado por limite de campanha, retry em 2 minutos
      const lastMessage = await prisma.campaignMessage.findFirst({
        where: {
          senderId: userId,
          campaignId
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });

      if (lastMessage) {
        const timeSinceLastMessage = now - lastMessage.createdAt.getTime();
        retryAfter = Math.ceil((2 * 60 * 1000 - timeSinceLastMessage) / 1000); // Segundos
      }
    } else if (!burstAllowed) {
      // Se bloqueado por burst, retry em 1 minuto
      const lastMessage = await prisma.campaignMessage.findFirst({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });

      if (lastMessage) {
        const timeSinceLastMessage = now - lastMessage.createdAt.getTime();
        retryAfter = Math.ceil((60 * 1000 - timeSinceLastMessage) / 1000);
      }
    } else if (!globalAllowed) {
      // Se bloqueado por limite global, retry quando a hora completar
      retryAfter = 3600; // 1 hora em segundos
    }

    return {
      allowed: globalAllowed && campaignAllowed && burstAllowed,
      retryAfter,
      globalLimit: { current: globalCount, max: globalMax },
      campaignLimit: { current: campaignCount, max: campaignMax },
      burstLimit: { current: burstCount, max: burstMax }
    };
  }

  /**
   * Atualiza a reputação do usuário após uma pergunta ser respondida
   * Diminui o spamScore para usuários bons
   */
  static async updateUserReputation(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        spamScore: true,
        messageCount: true,
        orders: { select: { id: true } }
      }
    });

    if (!user) return;

    let newSpamScore = user.spamScore;

    // Reduz spamScore para contas antigas (>30 dias)
    const accountAge = Date.now() - user.createdAt.getTime();
    if (accountAge > 30 * 24 * 60 * 60 * 1000) {
      newSpamScore = Math.max(0, newSpamScore - 5);
    }

    // Reduz spamScore para usuários com pedidos
    if (user.orders.length > 0) {
      newSpamScore = Math.max(0, newSpamScore - 10);
    }

    // Atualiza usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        messageCount: { increment: 1 },
        spamScore: newSpamScore
      }
    });
  }

  /**
   * Aumenta o spamScore de um usuário (quando uma mensagem é deletada como spam)
   */
  static async penalizeUser(userId: string, penalty: number = 20): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        spamScore: { increment: penalty }
      }
    });
  }

  /**
   * Retorna uma descrição formatada dos fatores de spam
   */
  static getSpamFactorsSummary(factors: SpamFactor[]): string {
    if (factors.length === 0) return 'Nenhum fator de risco detectado';

    return factors
      .sort((a, b) => b.weight - a.weight)
      .map(f => `• ${f.description} (+${f.weight} pontos)`)
      .join('\n');
  }
}
