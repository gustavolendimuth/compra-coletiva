import { describe, it, expect } from 'vitest';
import { getImageUrl, getImageUrlOrUndefined } from '../imageUrl';

describe('imageUrl utilities', () => {
  describe('getImageUrl', () => {
    it('should return null for undefined input', () => {
      expect(getImageUrl(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getImageUrl('')).toBeNull();
    });

    it('should return S3 URL as-is (https)', () => {
      const s3Url = 'https://bucket.s3.amazonaws.com/image.jpg';
      expect(getImageUrl(s3Url)).toBe(s3Url);
    });

    it('should return S3 URL as-is (http)', () => {
      const s3Url = 'http://bucket.s3.amazonaws.com/image.jpg';
      expect(getImageUrl(s3Url)).toBe(s3Url);
    });

    it('should prepend API_URL to local storage paths', () => {
      const localPath = '/uploads/campaigns/image.jpg';
      const result = getImageUrl(localPath);
      
      // Should have protocol
      expect(result).toMatch(/^https?:\/\//);
      // Should end with the path
      expect(result).toContain(localPath);
    });

    it('should handle paths without leading slash', () => {
      const localPath = 'uploads/campaigns/image.jpg';
      const result = getImageUrl(localPath);
      
      // Should have protocol
      expect(result).toMatch(/^https?:\/\//);
      // Should contain the path
      expect(result).toContain(localPath);
    });
  });

  describe('getImageUrlOrUndefined', () => {
    it('should return undefined for null input', () => {
      expect(getImageUrlOrUndefined(undefined)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(getImageUrlOrUndefined('')).toBeUndefined();
    });

    it('should return URL string for valid input', () => {
      const s3Url = 'https://bucket.s3.amazonaws.com/image.jpg';
      expect(getImageUrlOrUndefined(s3Url)).toBe(s3Url);
    });

    it('should return URL string for local path', () => {
      const localPath = '/uploads/campaigns/image.jpg';
      const result = getImageUrlOrUndefined(localPath);
      
      expect(result).toBeDefined();
      expect(result).toMatch(/^https?:\/\//);
      expect(result).toContain(localPath);
    });
  });
});
