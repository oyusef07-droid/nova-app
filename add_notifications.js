import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Creating notifications table...");
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("Adding admin_unread_count to support_tickets...");
    await sql`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS admin_unread_count INTEGER DEFAULT 0`;

    console.log("Database features for notifications added successfully.");
  } catch (err) {
    console.error("Database setup error:", err);
  }
}

run();
