import { neon, Pool } from '@neondatabase/serverless';
import NeonAdapter from './__create/adapter.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = NeonAdapter(pool);

async function run() {
  try {
    console.log("Testing createUser...");
    const newUser = await adapter.createUser({
      emailVerified: null,
      email: 'test_new_bug_99@test.com',
      name: 'Test Name',
      image: '/avatars/male.jpg',
      gender: 'Male',
      dob: '2000-01-01',
      country: 'Egypt'
    });
    console.log("User created:", newUser);

    console.log("Testing linkAccount...");
    await adapter.linkAccount({
      extraData: { password: 'hashedpassword123' },
      type: 'credentials',
      userId: newUser.id,
      providerAccountId: String(newUser.id),
      provider: 'credentials'
    });
    console.log("Account linked!");
  } catch (error) {
    console.error("ERROR OCCURRED:", error);
  } finally {
    await pool.end();
  }
}
run();
