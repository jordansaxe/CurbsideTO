// Creates an invite code: npm run invite -- [max uses] [note]
import { randomBytes } from "node:crypto";
import postgres from "postgres";

const maxUses = Number(process.argv[2] ?? 1);
if (!Number.isInteger(maxUses) || maxUses < 1) {
  console.error("Usage: npm run invite -- [max uses] [note]");
  process.exit(1);
}
const note = process.argv.slice(3).join(" ") || null;
const code = randomBytes(5).toString("hex");

const sql = postgres(process.env.DATABASE_URL);
await sql`insert into invites (code, note, max_uses) values (${code}, ${note}, ${maxUses})`;
await sql.end();
console.log(`Invite code: ${code} (${maxUses} use${maxUses === 1 ? "" : "s"})`);
