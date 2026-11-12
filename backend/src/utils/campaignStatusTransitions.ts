import { CampaignStatus } from '@prisma/client';

/**
 * Transições de status que o criador pode pedir (as mesmas que a UI oferece).
 * ARCHIVED entra e sai só pelo sistema (campaignStatusService).
 */
export const MANUAL_STATUS_TRANSITIONS: Record<CampaignStatus, readonly CampaignStatus[]> = {
  ACTIVE: ['CLOSED'],
  CLOSED: ['ACTIVE', 'SENT'],
  SENT: ['CLOSED'],
  ARCHIVED: [],
};

export function isManualStatusTransitionAllowed(from: CampaignStatus, to: CampaignStatus): boolean {
  return MANUAL_STATUS_TRANSITIONS[from].includes(to);
}

export function manualStatusTransitionError(from: CampaignStatus, to: CampaignStatus): string {
  return `Transição de status não permitida: ${from} → ${to}`;
}
