import sql from './src/app/api/utils/sql.js';

async function checkUser() {
  const email = process.argv[2];
  if (!email) {
    console.log("Please provide an email address.");
    return;
  }

  try {
    const users = await sql`SELECT * FROM auth_users WHERE email = ${email}`;
    console.log("Users:", users);

    if (users.length > 0) {
      const accounts = await sql`SELECT * FROM auth_accounts WHERE "userId" = ${users[0].id}`;
      console.log("Accounts:", accounts);
    }
  } catch (e) {
    console.error("DB Error:", e);
  }
}

checkUser();
