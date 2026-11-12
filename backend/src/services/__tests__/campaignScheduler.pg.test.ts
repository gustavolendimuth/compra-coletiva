import { Prisma } from "@prisma/client";
import { createPgClient, resetOrderTables, seedCampaign } from "../../__tests__/pgClient";

const db = createPgClient();
jest.mock("../../index", () => ({ prisma: db }));

const mockCheckRelease = jest.fn();
jest.mock("../paymentReleaseService", () => ({
  PaymentReleaseService: { checkAndReleaseForCampaign: (...args: unknown[]) => mockCheckRelease(...args) },
}));

import { closeExpiredCampaigns } from "../campaignScheduler";

afterAll(() => db.$disconnect());
beforeEach(() => resetOrderTables(db));

describe("closeExpiredCampaigns (Postgres)", () => {
  it("does not overwrite status changed after read", async () => {
    const past = new Date(Date.now() - 60_000);
    const { campaign: stillActive } = await seedCampaign(db, { deadline: past });
    const { campaign: becameSent } = await seedCampaign(db, { deadline: past });

    // Entre a leitura e a escrita do scheduler, o criador marca a campanha B como enviada
    const realFindMany = db.campaign.findMany.bind(db.campaign);
    const spy = jest.spyOn(db.campaign, "findMany").mockImplementationOnce((async (args: Prisma.CampaignFindManyArgs) => {
      const result = await realFindMany(args);
      await db.$executeRaw`UPDATE campaigns SET status = 'SENT' WHERE id = ${becameSent.id}`;
      return result;
    }) as unknown as typeof db.campaign.findMany);

    const closed = await closeExpiredCampaigns();
    spy.mockRestore();

    expect((await db.campaign.findUnique({ where: { id: becameSent.id } }))?.status).toBe("SENT");
    expect((await db.campaign.findUnique({ where: { id: stillActive.id } }))?.status).toBe("CLOSED");
    expect(closed).toBe(1);
    expect(mockCheckRelease.mock.calls.map(([id]) => id)).toEqual([stillActive.id]);
  });
});
