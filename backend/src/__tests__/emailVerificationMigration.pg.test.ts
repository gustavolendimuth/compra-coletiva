import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { createPgClient } from "./pgClient";

// Prova o backfill da migration rodando o SQL real num banco à parte:
// aplica as migrations anteriores, insere usuários no formato antigo e aplica esta.
const MIGRATIONS_DIR = path.resolve(__dirname, "../../prisma/migrations");
const TARGET = "20261116120000_email_verification";
const SCRATCH_DB = "cc_email_verification_migration";

const admin = createPgClient();
let scratch: PrismaClient;

// Cada comando roda sozinho: o Prisma não aceita vários comandos num prepared statement
const statementsOf = (migration: string) =>
  fs
    .readFileSync(path.join(MIGRATIONS_DIR, migration, "migration.sql"), "utf8")
    .replace(/--.*$/gm, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

const applyMigration = async (migration: string) => {
  for (const statement of statementsOf(migration)) {
    await scratch.$executeRawUnsafe(statement);
  }
};

const scratchUrl = () => {
  const url = new URL(process.env.TEST_DATABASE_URL as string);
  url.pathname = `/${SCRATCH_DB}`;
  return url.toString();
};

beforeAll(async () => {
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${SCRATCH_DB} WITH (FORCE)`);
  await admin.$executeRawUnsafe(`CREATE DATABASE ${SCRATCH_DB}`);
  scratch = new PrismaClient({ datasourceUrl: scratchUrl() });

  const previous = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name < TARGET && fs.existsSync(path.join(MIGRATIONS_DIR, name, "migration.sql")))
    .sort();
  for (const migration of previous) {
    await applyMigration(migration);
  }
});

afterAll(async () => {
  await scratch?.$disconnect();
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${SCRATCH_DB} WITH (FORCE)`);
  await admin.$disconnect();
});

describe("migration email_verification", () => {
  it("backfill: quem tem senha ou Google conta como verificado em createdAt; legado sem nenhum fica pendente", async () => {
    const createdAt = new Date("2025-03-04T05:06:07.890Z");
    const users = [
      { id: "with-password", password: "hash", googleId: null },
      { id: "with-google", password: null, googleId: "google-1" },
      { id: "with-both", password: "hash", googleId: "google-2" },
      { id: "legacy", password: null, googleId: null },
    ];
    for (const user of users) {
      await scratch.$executeRawUnsafe(
        `INSERT INTO "users" ("id", "email", "name", "password", "googleId", "createdAt", "updatedAt")
         VALUES ($1, $2, 'Usuário Teste', $3, $4, $5, $5)`,
        user.id,
        `${user.id}@test.com`,
        user.password,
        user.googleId,
        createdAt
      );
    }

    await applyMigration(TARGET);

    // Só os usuários do teste (as migrations antigas também criam um usuário de sistema)
    const rows = await scratch.$queryRawUnsafe<Array<{ id: string; emailVerifiedAt: Date | null }>>(
      `SELECT "id", "emailVerifiedAt" FROM "users" WHERE "id" = ANY($1)`,
      users.map((user) => user.id)
    );
    expect(Object.fromEntries(rows.map((row) => [row.id, row.emailVerifiedAt]))).toEqual({
      "with-password": createdAt,
      "with-google": createdAt,
      "with-both": createdAt,
      legacy: null,
    });
  });
});
