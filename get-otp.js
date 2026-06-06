import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const data = await sql`SELECT *, expires::text as expires_str FROM auth_verification_token WHERE identifier = 'imomarnasr@gmail.com'`;
  console.log('OTP Data:', data);
  process.exit(0);
}

run();
