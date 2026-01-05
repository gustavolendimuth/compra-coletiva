import { capitalizeName } from './nameFormatter';

describe('nameFormatter', () => {
  describe('capitalizeName', () => {
    it('should capitalize first letter of each word', () => {
      expect(capitalizeName('joão da silva')).toBe('João Da Silva');
      expect(capitalizeName('maria santos')).toBe('Maria Santos');
      expect(capitalizeName('pedro henrique')).toBe('Pedro Henrique');
    });

    it('should handle already capitalized names', () => {
      expect(capitalizeName('João Da Silva')).toBe('João Da Silva');
      expect(capitalizeName('Maria Santos')).toBe('Maria Santos');
    });

    it('should handle all uppercase names', () => {
      expect(capitalizeName('JOÃO DA SILVA')).toBe('João Da Silva');
      expect(capitalizeName('MARIA SANTOS')).toBe('Maria Santos');
    });

    it('should handle all lowercase names', () => {
      expect(capitalizeName('joão da silva')).toBe('João Da Silva');
      expect(capitalizeName('maria santos')).toBe('Maria Santos');
    });

    it('should handle mixed case names', () => {
      expect(capitalizeName('jOãO dA sIlVa')).toBe('João Da Silva');
      expect(capitalizeName('mArIa SaNtOs')).toBe('Maria Santos');
    });

    it('should handle single word names', () => {
      expect(capitalizeName('joão')).toBe('João');
      expect(capitalizeName('maria')).toBe('Maria');
    });

    it('should handle extra spaces', () => {
      expect(capitalizeName('  joão da silva  ')).toBe('João Da Silva');
      expect(capitalizeName('joão  da  silva')).toBe('João  Da  Silva');
    });

    it('should handle empty string', () => {
      expect(capitalizeName('')).toBe('');
    });

    it('should handle single letter names', () => {
      expect(capitalizeName('a')).toBe('A');
      expect(capitalizeName('b c d')).toBe('B C D');
    });

    it('should handle special characters', () => {
      expect(capitalizeName("d'angelo")).toBe("D'angelo");
      expect(capitalizeName('joão-pedro')).toBe('João-pedro');
    });

    it('should return original value for invalid inputs', () => {
      expect(capitalizeName(null as any)).toBe(null);
      expect(capitalizeName(undefined as any)).toBe(undefined);
      expect(capitalizeName(123 as any)).toBe(123);
    });
  });
});
