import { parseArgs } from "node:util";
import { hashPassword } from "../dist/modules/access/index.js";
import pg from "pg";
const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    venue: { type: "string" },
    role: { type: "string", default: "staff" },
  },
});
const password = process.env.STAFF_PASSWORD;
if (
  !values.email ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ||
  !values.name ||
  !values.venue ||
  !["owner", "staff"].includes(values.role) ||
  !password ||
  password.length < 12 ||
  password.length > 256
) {
  throw new Error(
    "Use --email --name --venue <slug> [--role staff|owner], and STAFF_PASSWORD environment variable (12–256 characters). No default credential exists.",
  );
}
const passwordHash = await hashPassword(password);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  const { rows: venues } = await client.query(
    "SELECT id,organization_id FROM venues WHERE slug=$1",
    [values.venue],
  );
  if (!venues[0]) throw new Error("Unknown venue");
  // Existing staff credentials are never silently changed by granting another venue.
  const { rows: users } = await client.query(
    `INSERT INTO staff_users(email,name,password_hash) VALUES($1,$2,$3)
    ON CONFLICT(email) DO UPDATE SET email=EXCLUDED.email RETURNING id`,
    [values.email.toLowerCase(), values.name, passwordHash],
  );
  await client.query(
    `INSERT INTO memberships(user_id,organization_id,role) VALUES($1,$2,$3)
    ON CONFLICT(user_id,organization_id) DO UPDATE SET role=EXCLUDED.role`,
    [users[0].id, venues[0].organization_id, values.role],
  );
  await client.query(
    "INSERT INTO venue_permissions(user_id,organization_id,venue_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
    [users[0].id, venues[0].organization_id, venues[0].id],
  );
  await client.query("COMMIT");
  console.log("Staff membership granted for", values.venue);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
