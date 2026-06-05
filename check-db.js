import sql from './src/app/api/utils/sql.js';

async function checkTokens() {
  try {
    const result = await sql`SELECT * FROM auth_verification_token`;
    console.log('All tokens in DB:', result);
    
    // Check if the email exists in auth_users
    const users = await sql`SELECT id, email FROM auth_users WHERE email ILIKE '%imomarnasr%'`;
    console.log('Users found:', users);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTokens();
