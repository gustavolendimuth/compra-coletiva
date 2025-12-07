import { prisma } from '../index';

/**
 * Converts a string to a URL-friendly slug
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Remove acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove caracteres especiais
    .replace(/[^\w\s-]/g, '')
    // Substitui espaços por hífens
    .replace(/\s+/g, '-')
    // Remove hífens duplicados
    .replace(/-+/g, '-')
    // Remove hífens do início e fim
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique slug for a campaign
 * @param name - Campaign name
 * @param campaignId - Optional campaign ID (for updates)
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  name: string,
  campaignId?: string
): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists (excluding current campaign if updating)
  while (true) {
    const existing = await prisma.campaign.findUnique({
      where: { slug },
      select: { id: true },
    });

    // Slug is unique if not found, or if it belongs to the current campaign
    if (!existing || (campaignId && existing.id === campaignId)) {
      break;
    }

    // Append counter and try again
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Validates if a slug is valid
 * @param slug - Slug to validate
 * @returns true if valid
 */
export function isValidSlug(slug: string): boolean {
  // Must be lowercase, alphanumeric with hyphens, no spaces
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

