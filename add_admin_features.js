import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Adding is_banned to auth_users...");
    await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE`;

    console.log("Adding admin_deleted and user_deleted to support_tickets...");
    await sql`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS admin_deleted BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_deleted BOOLEAN DEFAULT FALSE`;

    console.log("Database features added successfully.");
  } catch (err) {
    console.error("Database setup error:", err);
  }
}

run();
