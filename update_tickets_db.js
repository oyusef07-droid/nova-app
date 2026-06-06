import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Adding media columns to ticket_messages...");
    await sql`ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS media_url TEXT`;
    await sql`ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS media_type TEXT`;

    console.log("Creating ticket_ratings table...");
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_ratings (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("Updating old notifications links to point to contact page...");
    await sql`
      UPDATE notifications 
      SET link = REPLACE(link, '/profile?tab=tickets', '/contact')
      WHERE link LIKE '%/profile?tab=tickets%'
    `;

    console.log("Database features added successfully.");
  } catch (err) {
    console.error("Database setup error:", err);
  }
}

run();
