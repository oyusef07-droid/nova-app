import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  try {
    console.log("Creating support_tickets table...");
    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log("Creating ticket_messages table...");
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Also ensuring auth tables exist if they don't already (Adapter tables)
    console.log("Ensuring auth_users table exists...");
    await sql`
      CREATE TABLE IF NOT EXISTS auth_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        "emailVerified" TIMESTAMP,
        image TEXT
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS auth_accounts (
        id SERIAL PRIMARY KEY,
        "userId" UUID REFERENCES auth_users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        password TEXT,
        UNIQUE(provider, "providerAccountId")
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id SERIAL PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" UUID REFERENCES auth_users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      )
    `;
    
    console.log("Database setup complete!");
  } catch (err) {
    console.error("Database setup error:", err);
  }
}

setup();
