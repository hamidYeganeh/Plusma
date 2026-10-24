import { createApp } from "./app";
async function main() {
  const { DATABASE_URL, APP_SECRET, TRUSTED_ORIGINS } = process.env;
  if (!DATABASE_URL || !APP_SECRET || !TRUSTED_ORIGINS)
    throw new Error(
      "DATABASE_URL, APP_SECRET and TRUSTED_ORIGINS are required",
    );
  const app = await createApp({
    databaseUrl: DATABASE_URL,
    secret: APP_SECRET,
    origins: TRUSTED_ORIGINS.split(",").map((value) => value.trim()),
    production: process.env.NODE_ENV === "production",
  });
  await app.listen(
    Number(process.env.PORT ?? 3001),
    process.env.HOST ?? "127.0.0.1",
  );
}
void main();
