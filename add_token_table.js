import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS auth_verification_token (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires TIMESTAMP NOT NULL,
      PRIMARY KEY (identifier, token)
    )
  `;
  console.log("auth_verification_token table created successfully");
}
run().catch(console.error);
