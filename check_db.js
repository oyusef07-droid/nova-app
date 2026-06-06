import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const messages = await sql`SELECT * FROM ticket_messages ORDER BY id DESC LIMIT 5`;
    console.log(JSON.stringify(messages, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
