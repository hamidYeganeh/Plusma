import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
export async function seed(connectionString) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    const fixtures = JSON.parse(
      await readFile(new URL("./fixtures/cafes.json", import.meta.url), "utf8"),
    );
    for (const venue of fixtures) {
      const { rows: orgs } = await client.query(
        `INSERT INTO organizations(id,name) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
        [venue.organizationId, venue.name],
      );
      const { rows } = await client.query(
        `INSERT INTO venues(organization_id,slug,name) VALUES($1,$2,$3) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
        [orgs[0].id, venue.slug, venue.name],
      );
      for (const table of venue.tables) {
        // Capacity changes require a deliberate operational migration, not an incidental reseed.
        await client.query(
          "INSERT INTO cafe_tables(venue_id,table_id,capacity,zone) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
          [rows[0].id, table.id, table.capacity, table.zone],
        );
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await seed(process.env.DATABASE_URL);
  console.log("Local cafe fixtures ready");
}
