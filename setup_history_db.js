import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Creating user_history table...");
    await sql`
      CREATE TABLE IF NOT EXISTS user_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
          title TEXT,
          thumbnail TEXT,
          platform_id TEXT,
          platform_name TEXT,
          format_type TEXT,
          format_label TEXT,
          source_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Successfully created user_history table.");
  } catch (err) {
    console.error("Error creating table:", err);
  }
}

run();
