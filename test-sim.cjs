const { Pool } = require('@neondatabase/serverless');
const adapterFactory = require('./__create/adapter.ts').default;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = adapterFactory(pool);

async function simulate() {
  try {
    const user = {
      name: "Omar Yusef",
      email: "omaryusef" + Math.random() + "@gmail.com",
      image: "https://lh3.googleusercontent.com/a/test",
      emailVerified: new Date()
    };
    console.log("Creating user...");
    const createdUser = await adapter.createUser(user);
    console.log("User created:", createdUser);

    const account = {
      userId: createdUser.id,
      provider: "google",
      type: "oauth",
      providerAccountId: "123456789",
      access_token: "test_token",
      id_token: "test_id_token",
      token_type: "Bearer",
      scope: "openid email profile"
    };
    console.log("Linking account...");
    const linked = await adapter.linkAccount(account);
    console.log("Account linked:", linked);
  } catch(err) {
    console.error("SIMULATION ERROR:", err);
  } finally {
    await pool.end();
  }
}
simulate();
