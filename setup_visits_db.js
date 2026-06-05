import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  try {
    console.log("Creating site_visits table...");
    await sql`
      CREATE TABLE IF NOT EXISTS site_visits (
        id SERIAL PRIMARY KEY,
        ip_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Add an index on created_at for faster stats querying
    await sql`CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at)`;
    
    console.log("Database setup complete!");
  } catch (err) {
    console.error("Database setup error:", err);
  }
}

setup();
