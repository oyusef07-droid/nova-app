import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function run() {
  await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS gender TEXT, ADD COLUMN IF NOT EXISTS dob TEXT, ADD COLUMN IF NOT EXISTS country TEXT`;
  console.log("Columns added successfully");
}
run().catch(console.error);
