import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Clearing database tables...");
    await sql`DELETE FROM "auth_accounts"`;
    await sql`DELETE FROM "auth_sessions"`;
    await sql`DELETE FROM "auth_verification_token"`;
    await sql`DELETE FROM "auth_users"`;
    console.log("Database cleared successfully!");
  } catch (err) {
    console.error("Error clearing database:", err);
  }
}

run();
