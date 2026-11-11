import { generatePublicAlias } from './publicAlias';

describe('publicAlias', () => {
  describe('generatePublicAlias', () => {
    it('should generate deterministic alias for same user and campaign', () => {
      const alias1 = generatePublicAlias('user-123', 'campaign-abc');
      const alias2 = generatePublicAlias('user-123', 'campaign-abc');

      expect(alias1).toBe(alias2);
    });

    it('should generate different aliases for different users in same campaign', () => {
      const alias1 = generatePublicAlias('user-123', 'campaign-abc');
      const alias2 = generatePublicAlias('user-456', 'campaign-abc');

      expect(alias1).not.toBe(alias2);
    });

    it('should generate alias in expected format', () => {
      const alias = generatePublicAlias('user-123', 'campaign-abc');

      expect(alias).toMatch(/^[A-Za-z]+ [A-Za-z]+ [0-9A-F]{2}$/);
    });
  });
});
