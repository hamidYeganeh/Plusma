import { access, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { parseEnv } from "node:util";
const root = new URL("../", import.meta.url);
const rootPath = new URL(".env.local", root),
  apiPath = new URL("apps/api/.env.local", root);
const existing = async (path) =>
  parseEnv(
    await readFile(path, "utf8").catch((error) => {
      if (error.code === "ENOENT") return "";
      throw error;
    }),
  );
const rootEnv = await existing(rootPath),
  apiEnv = await existing(apiPath);
const apiPassword = apiEnv.DATABASE_URL
  ? decodeURIComponent(new URL(apiEnv.DATABASE_URL).password)
  : undefined;
if (
  rootEnv.POSTGRES_PASSWORD &&
  apiPassword &&
  rootEnv.POSTGRES_PASSWORD !== apiPassword
)
  throw new Error(
    "Existing local database passwords differ. Align root .env.local with apps/api/.env.local; no files changed.",
  );
const password =
  rootEnv.POSTGRES_PASSWORD ?? apiPassword ?? randomBytes(24).toString("hex");
async function create(path, contents) {
  try {
    await access(path);
    console.log("Kept existing", path.pathname.split("/").slice(-3).join("/"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeFile(path, contents, { flag: "wx", mode: 0o600 });
    console.log("Created local configuration");
  }
}
await create(rootPath, `POSTGRES_PASSWORD=${password}\n`);
await create(
  apiPath,
  `DATABASE_URL=postgresql://plusma:${encodeURIComponent(password)}@localhost:54329/plusma\nAPP_SECRET=${randomBytes(32).toString("hex")}\nPORT=3001\nTRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000\n`,
);
console.log(
  "Next: npm run db:up, npm run db:migrate, npm run db:seed, npm run dev",
);
