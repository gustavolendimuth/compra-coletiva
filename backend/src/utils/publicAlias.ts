import crypto from "crypto";

const PUBLIC_ALIAS_SECRET =
  process.env.PUBLIC_ALIAS_SECRET ||
  process.env.JWT_ACCESS_SECRET ||
  "dev-public-alias-secret-change-in-production";

const FUN_ADJECTIVES = [
  "Agil",
  "Alegre",
  "Brilhante",
  "Charmoso",
  "Curioso",
  "Doce",
  "Eletrico",
  "Esperto",
  "Feliz",
  "Forte",
  "Genial",
  "Leve",
  "Ligeiro",
  "Lunar",
  "Magico",
  "Manso",
  "Misterioso",
  "Nobre",
  "Radiante",
  "Sereno",
  "Solar",
  "Valente",
  "Veloz",
  "Vibrante",
];

const FUN_ANIMALS = [
  "Arara",
  "Baleia",
  "Capivara",
  "Coruja",
  "Delfim",
  "Esquilo",
  "Falcao",
  "Gatinho",
  "Golfinho",
  "Guaxinim",
  "Iguana",
  "Jacare",
  "Lhama",
  "Lince",
  "Lontra",
  "Macaco",
  "Panda",
  "Pinguim",
  "Raposa",
  "Sabia",
  "Suricato",
  "Tamandua",
  "Tatu",
  "Tucano",
];

export function generatePublicAlias(userId: string, campaignId: string): string {
  const digest = crypto
    .createHmac("sha256", PUBLIC_ALIAS_SECRET)
    .update(`${campaignId}:${userId}`)
    .digest("hex");

  const adjective = FUN_ADJECTIVES[parseInt(digest.slice(0, 2), 16) % FUN_ADJECTIVES.length];
  const animal = FUN_ANIMALS[parseInt(digest.slice(2, 4), 16) % FUN_ANIMALS.length];
  const suffix = digest.slice(4, 6).toUpperCase();

  return `${adjective} ${animal} ${suffix}`;
}
