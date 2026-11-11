/**
 * Image URL Utilities
 * Helpers for building full image URLs from backend responses
 */

import { PUBLIC_API_URL } from "@/lib/env";

/**
 * Build full image URL from backend response
 * 
 * @param imageUrl - The image URL from backend (can be S3 URL or local path)
 * @returns Full image URL with protocol, or null if no image
 * 
 * @example
 * // S3 URL (already complete)
 * getImageUrl('https://bucket.s3.amazonaws.com/image.jpg')
 * // => 'https://bucket.s3.amazonaws.com/image.jpg'
 * 
 * // Local storage path
 * getImageUrl('/uploads/campaigns/image.jpg')
 * // => 'http://localhost:3000/uploads/campaigns/image.jpg'
 */
export function getImageUrl(imageUrl?: string): string | null {
  if (!imageUrl) return null;
  
  // S3 URLs are already complete
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Local storage paths need public API prefix.
  // Do not use INTERNAL_API_URL here to avoid SSR/client hydration mismatch.
  return `${PUBLIC_API_URL}${imageUrl}`;
}

/**
 * Build full image URL for ImageUpload component
 * Same as getImageUrl but returns undefined instead of null
 */
export function getImageUrlOrUndefined(imageUrl?: string): string | undefined {
  const url = getImageUrl(imageUrl);
  return url ?? undefined;
}
