const { Pool } = require('@neondatabase/serverless');
const adapterFactory = require('./__create/adapter.ts').default;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = adapterFactory(pool);

async function test() {
  try {
    const accountUser = await adapter.getUserByAccount({ provider: "google", providerAccountId: "123456789" });
    console.log("accountUser:", accountUser);
    
    // Simulate what handleLoginOrRegister does:
    // It gets user by email.
    const userByEmail = await adapter.getUserByEmail("omaryusef0.9276082806858859@gmail.com");
    console.log("userByEmail:", userByEmail);
    
    // Then it links account
    const account = {
      userId: userByEmail.id,
      provider: "google",
      type: "oauth",
      providerAccountId: "12345678910", // new
      access_token: "test_token",
      id_token: "test_id_token",
      token_type: "Bearer",
      scope: "openid email profile"
    };
    const linked = await adapter.linkAccount(account);
    console.log("linked:", linked);
  } catch(e) {
    console.error("ERROR", e);
  } finally {
    pool.end();
  }
}
test();
