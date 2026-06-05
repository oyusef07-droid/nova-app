import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const bannedUsers = await sql`SELECT * FROM auth_users WHERE is_banned = TRUE`;
    console.log("Banned users:", bannedUsers);

    if (bannedUsers.length > 0) {
      console.log("Unbanning all currently banned users...");
      await sql`UPDATE auth_users SET is_banned = FALSE WHERE is_banned = TRUE`;
      console.log("Users unbanned successfully.");
    } else {
      console.log("No users are currently banned.");
    }
  } catch (err) {
    console.error("Database query error:", err);
  }
}

run();
