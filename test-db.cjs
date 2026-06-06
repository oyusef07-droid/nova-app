const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function test() {
  try {
    const resUsers = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'auth_users'`);
    console.log('auth_users schema:', resUsers.rows);
    const resAccounts = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'auth_accounts'`);
    console.log('auth_accounts schema:', resAccounts.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
test();
