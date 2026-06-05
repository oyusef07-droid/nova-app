import sql from './src/utils/sql.js';
async function get() {
  const tokens = await sql`SELECT * FROM auth_verification_token ORDER BY expires DESC LIMIT 1`;
  console.log('Latest OTP:', tokens);
  process.exit(0);
}
get();
