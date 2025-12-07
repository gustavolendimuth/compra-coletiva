/**
 * Migration Script: Generate Slugs for Existing Campaigns
 * 
 * This script generates unique slugs for all existing campaigns in the database.
 * Run this AFTER applying the Prisma migration that adds the slug field.
 * 
 * Usage:
 *   npx ts-node scripts/generate-campaign-slugs.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateUniqueSlug } from '../src/utils/slugify';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting campaign slug generation...\n');

  try {
    // Get all campaigns that don't have a slug yet
    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        createdAt: 'asc', // Process oldest first
      },
    });

    if (campaigns.length === 0) {
      console.log('✅ All campaigns already have slugs! Nothing to do.\n');
      return;
    }

    console.log(`📋 Found ${campaigns.length} campaign(s) without slugs\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const campaign of campaigns) {
      try {
        // Generate unique slug
        const slug = await generateUniqueSlug(campaign.name, campaign.id);

        // Update campaign with new slug
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { slug },
        });

        console.log(`✓ Generated slug for "${campaign.name}": ${slug}`);
        successCount++;
      } catch (error: any) {
        console.error(`✗ Error processing campaign "${campaign.name}":`, error.message);
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

