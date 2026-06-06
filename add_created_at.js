import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    console.log("Column created_at added successfully.");
  } catch (e) {
    console.error(e);
  }
}
run();
