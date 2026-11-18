import { createPgClient, resetOrderTables } from "../../__tests__/pgClient";

const db = createPgClient();
jest.mock("../../index", () => ({ prisma: db }));

import { generateUniqueSlug, slugify } from "../slugify";

// O backend é a única fonte do slug: gera ao criar e ao renomear a campanha
describe("slug de campanha", () => {
  let creatorId: string;

  beforeEach(async () => {
    await resetOrderTables(db);
    creatorId = (await db.user.create({ data: { email: "criador@test.com", name: "Criador" } })).id;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  const createCampaign = async (name: string) =>
    db.campaign.create({ data: { name, slug: await generateUniqueSlug(name), creatorId } });

  it("tira acentos, caracteres especiais e espaços do nome", () => {
    expect(slugify("  Café Orgânico & Pão  de Queijo! ")).toBe("cafe-organico-pao-de-queijo");
  });

  it("nome repetido ganha sufixo numérico", async () => {
    const first = await createCampaign("Queijos da Serra");
    const second = await createCampaign("Queijos da Serra");
    const third = await createCampaign("Queijos da Serra");

    expect([first.slug, second.slug, third.slug]).toEqual([
      "queijos-da-serra",
      "queijos-da-serra-1",
      "queijos-da-serra-2",
    ]);
  });

  it("renomear para o mesmo nome mantém o slug da própria campanha", async () => {
    await createCampaign("Queijos da Serra");
    const second = await createCampaign("Queijos da Serra");

    expect(await generateUniqueSlug("Queijos da Serra", second.id)).toBe("queijos-da-serra-1");
  });

  it("renomear gera slug do novo nome sem colidir com outra campanha", async () => {
    await createCampaign("Café Especial");
    const other = await createCampaign("Mel Silvestre");

    expect(await generateUniqueSlug("Café Especial", other.id)).toBe("cafe-especial-1");
  });
});
