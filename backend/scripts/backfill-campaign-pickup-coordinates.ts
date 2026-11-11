import { PrismaClient } from "@prisma/client";
import { geocodingService } from "../src/services/geocodingService";

const prisma = new PrismaClient();

interface CampaignPickupRecord {
  id: string;
  name: string;
  pickupZipCode: string | null;
  pickupAddress: string | null;
  pickupAddressNumber: string | null;
  pickupNeighborhood: string | null;
  pickupCity: string | null;
  pickupState: string | null;
}

function normalizeText(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function resolvePickupLocation(campaign: CampaignPickupRecord) {
  const zipCode = normalizeText(campaign.pickupZipCode);
  const address = normalizeText(campaign.pickupAddress);
  const addressNumber = normalizeText(campaign.pickupAddressNumber) || "";
  const pickupNeighborhood = normalizeText(campaign.pickupNeighborhood);
  let pickupCity = normalizeText(campaign.pickupCity);
  let pickupState = normalizeText(campaign.pickupState);

  if (zipCode) {
    try {
      const geoResult = await geocodingService.geocodeCEP(zipCode, addressNumber);
      return {
        pickupZipCode: geoResult.zipCode,
        pickupNeighborhood: pickupNeighborhood || geoResult.neighborhood || undefined,
        pickupCity: pickupCity || geoResult.city || undefined,
        pickupState: pickupState || geoResult.state || undefined,
        pickupLatitude: geoResult.latitude,
        pickupLongitude: geoResult.longitude,
      };
    } catch (error) {
      console.warn(`⚠️ [${campaign.id}] Falha no CEP, tentando fallback por endereço:`, error);
    }
  }

  if (zipCode && (!pickupCity || !pickupState)) {
    try {
      const addressFromCep = await geocodingService.getAddressFromCEP(zipCode);
      pickupCity = pickupCity || normalizeText(addressFromCep.city);
      pickupState = pickupState || normalizeText(addressFromCep.state);
    } catch (error) {
      console.warn(`⚠️ [${campaign.id}] Não foi possível complementar cidade/estado pelo CEP:`, error);
    }
  }

  if (address && pickupCity && pickupState) {
    try {
      const coords = await geocodingService.getCoordinates(
        address,
        addressNumber,
        pickupCity,
        pickupState
      );

      return {
        pickupZipCode: zipCode,
        pickupNeighborhood,
        pickupCity,
        pickupState,
        pickupLatitude: coords.latitude,
        pickupLongitude: coords.longitude,
      };
    } catch (error) {
      console.warn(`⚠️ [${campaign.id}] Falha no fallback por endereço:`, error);
    }
  }

  if (pickupCity && pickupState) {
    try {
      const coords = await geocodingService.getCoordinates("", "", pickupCity, pickupState);

      return {
        pickupZipCode: zipCode,
        pickupNeighborhood,
        pickupCity,
        pickupState,
        pickupLatitude: coords.latitude,
        pickupLongitude: coords.longitude,
      };
    } catch (error) {
      console.warn(`⚠️ [${campaign.id}] Falha no fallback por cidade/estado:`, error);
    }
  }

  return null;
}

async function main() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      pickupAddress: { not: null },
      OR: [{ pickupLatitude: null }, { pickupLongitude: null }],
    },
    select: {
      id: true,
      name: true,
      pickupZipCode: true,
      pickupAddress: true,
      pickupAddressNumber: true,
      pickupNeighborhood: true,
      pickupCity: true,
      pickupState: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (campaigns.length === 0) {
    console.log("Nenhuma campanha pendente de geocodificação.");
    return;
  }

  console.log(`Iniciando backfill de coordenadas para ${campaigns.length} campanha(s)...`);

  let updated = 0;
  let skipped = 0;

  for (const campaign of campaigns) {
    const resolved = await resolvePickupLocation(campaign);

    if (!resolved) {
      skipped += 1;
      console.log(`⏭️  [${campaign.id}] ${campaign.name} - sem coordenadas (não resolvido)`);
      continue;
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        pickupZipCode: resolved.pickupZipCode,
        pickupNeighborhood: resolved.pickupNeighborhood,
        pickupCity: resolved.pickupCity,
        pickupState: resolved.pickupState,
        pickupLatitude: resolved.pickupLatitude,
        pickupLongitude: resolved.pickupLongitude,
      },
    });

    updated += 1;
    console.log(
      `✅ [${campaign.id}] ${campaign.name} -> (${resolved.pickupLatitude}, ${resolved.pickupLongitude})`
    );

    // Nominatim possui rate-limit agressivo. Espaço entre requisições evita bloqueio.
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  console.log("\nResumo do backfill:");
  console.log(`- Atualizadas: ${updated}`);
  console.log(`- Sem resolução: ${skipped}`);
  console.log(`- Total analisado: ${campaigns.length}`);
}

main()
  .catch((error) => {
    console.error("Erro no backfill de coordenadas:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
