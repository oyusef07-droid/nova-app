import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE user_history ADD COLUMN IF NOT EXISTS download_url TEXT`;
    console.log("Column download_url added successfully.");
  } catch (e) {
    console.error(e);
  }
}
run();
