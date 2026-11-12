import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "../../../..");
const files = ["docs/deployment.md", "backend/.env.example"];

describe("secret documentation", () => {
  for (const file of files) {
    it(`${file} lists exactly the required secrets and never JWT_SECRET`, () => {
      const content = fs.readFileSync(path.join(repoRoot, file), "utf8");
      const listed = [...content.matchAll(/^\s*([A-Z_]*SECRET[A-Z_]*)=/gm)]
        .map((m) => m[1])
        .filter((name) => name.startsWith("JWT") || name === "PUBLIC_ALIAS_SECRET");

      expect([...new Set(listed)].sort()).toEqual(
        ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "PUBLIC_ALIAS_SECRET"].sort()
      );
      expect(content).not.toMatch(/\bJWT_SECRET\b/);
    });
  }
});
