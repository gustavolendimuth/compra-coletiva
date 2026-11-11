/**
 * Standalone Script: Generate Slugs for Existing Campaigns
 * This version doesn't import from src/ to avoid starting the server
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Converts a string to a URL-friendly slug
 */
function slugify(text: string): string {
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
 */
async function generateUniqueSlug(name: string, campaignId?: string): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.campaign.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (campaignId && existing.id === campaignId)) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function main() {
  console.log('🔄 Starting campaign slug generation...\n');

  try {
    // Get all campaigns
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📋 Found ${campaigns.length} campaign(s) total\n`);

    const campaignsWithoutSlugs = campaigns;

    if (campaignsWithoutSlugs.length === 0) {
      console.log('✅ No campaigns found.\n');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const campaign of campaignsWithoutSlugs) {
      try {
        const slug = await generateUniqueSlug(campaign.name, campaign.id);

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { slug },
        });

        console.log(`✓ Generated slug for "${campaign.name}": ${slug}`);
        successCount++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`✗ Error processing campaign "${campaign.name}":`, message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }
    console.log('');

    if (errorCount > 0) {
      console.log('⚠️  Some campaigns failed to update. Please check the errors above.\n');
      process.exit(1);
    } else {
      console.log('🎉 All campaigns now have unique slugs!\n');
    }
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
