/**
 * Email Preferences Routes
 */

import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { EmailPreferenceService } from '../services/email/emailPreferences';

const router = express.Router();

/**
 * GET /api/email-preferences
 * Obtém preferências de email do usuário autenticado
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const preferences = await EmailPreferenceService.getOrCreatePreferences(userId);

    res.json(preferences);
  })
);

/**
 * PATCH /api/email-preferences
 * Atualiza preferências de email do usuário
 */
const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  campaignReadyToSend: z.boolean().optional(),
  campaignStatusChanged: z.boolean().optional(),
  campaignArchived: z.boolean().optional(),
  newMessage: z.boolean().optional(),
  digestEnabled: z.boolean().optional(),
  digestFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
});

router.patch(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // Validar body
    const data = updatePreferencesSchema.parse(req.body);

    const updated = await EmailPreferenceService.updatePreferences(userId, data);

    res.json(updated);
  })
);

/**
 * POST /api/email-preferences/unsubscribe
 * Endpoint público para unsubscribe via link de email
 * Query params: ?token=xxx&userId=xxx
 */
const unsubscribeQuerySchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  userId: z.string().min(1, 'userId é obrigatório'),
});

router.post(
  '/unsubscribe',
  asyncHandler(async (req, res) => {
    // Validar query params
    const { token, userId } = unsubscribeQuerySchema.parse(req.query);

    const success = await EmailPreferenceService.unsubscribeByToken(userId, token);

    if (success) {
      res.json({
        success: true,
        message: 'Você foi removido da lista de emails com sucesso.',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Link de unsubscribe inválido ou expirado.',
      });
    }
  })
);

/**
 * POST /api/email-preferences/resubscribe
 * Reabilita emails para o usuário autenticado
 */
router.post(
  '/resubscribe',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const updated = await EmailPreferenceService.resubscribe(userId);

    res.json({
      success: true,
      message: 'Emails reativados com sucesso.',
      preferences: updated,
    });
  })
);

export default router;
