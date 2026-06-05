import sql from './src/app/api/utils/sql.js';
async function run() {
  try {
    const res = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log(res);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run();
