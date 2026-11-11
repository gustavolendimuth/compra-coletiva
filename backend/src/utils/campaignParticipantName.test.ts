import { getCampaignParticipantDisplayName } from './campaignParticipantName';
import { generatePublicAlias } from './publicAlias';

describe('campaignParticipantName', () => {
  describe('getCampaignParticipantDisplayName', () => {
    it('should return first and last name when masking is disabled', () => {
      const displayName = getCampaignParticipantDisplayName({
        fullName: 'Maria Clara de Souza',
        hideNameInCampaigns: false,
        userId: 'user-1',
        campaignId: 'campaign-1',
      });

      expect(displayName).toBe('Maria Souza');
    });

    it('should keep single-word names when masking is disabled', () => {
      const displayName = getCampaignParticipantDisplayName({
        fullName: 'Madonna',
        hideNameInCampaigns: false,
        userId: 'user-1',
        campaignId: 'campaign-1',
      });

      expect(displayName).toBe('Madonna');
    });

    it('should return public alias when masking is enabled', () => {
      const alias = getCampaignParticipantDisplayName({
        fullName: 'Maria Clara de Souza',
        hideNameInCampaigns: true,
        userId: 'user-1',
        campaignId: 'campaign-1',
      });

      expect(alias).toBe(generatePublicAlias('user-1', 'campaign-1'));
    });

    it('should fallback to public alias when name is empty', () => {
      const alias = getCampaignParticipantDisplayName({
        fullName: '   ',
        hideNameInCampaigns: false,
        userId: 'user-1',
        campaignId: 'campaign-1',
      });

      expect(alias).toBe(generatePublicAlias('user-1', 'campaign-1'));
    });
  });
});
