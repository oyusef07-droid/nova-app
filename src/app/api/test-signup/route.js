import sql from '../utils/sql';

export async function GET(req) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email') || 'testuser_' + Date.now() + '@test.com';
  const password = url.searchParams.get('password') || 'test123456';
  const name = url.searchParams.get('name') || 'Test User';

  const steps = [];

  try {
    // Step 1: Test bcryptjs import
    steps.push('Step 1: Importing bcryptjs...');
    let bcrypt;
    try {
      bcrypt = await import('bcryptjs');
      bcrypt = bcrypt.default || bcrypt;
      steps.push('Step 1: ✅ bcryptjs imported successfully');
    } catch (e) {
      steps.push('Step 1: ❌ bcryptjs import FAILED: ' + e.message);
      return new Response(JSON.stringify({ success: false, steps, error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    // Step 2: Test password hashing
    steps.push('Step 2: Hashing password...');
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
      steps.push('Step 2: ✅ Password hashed: ' + hashedPassword.substring(0, 20) + '...');
    } catch (e) {
      steps.push('Step 2: ❌ Password hashing FAILED: ' + e.message);
      return new Response(JSON.stringify({ success: false, steps, error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    // Step 3: Test password verification
    steps.push('Step 3: Verifying password...');
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      steps.push('Step 3: ✅ Password verification: ' + (isValid ? 'MATCH' : 'NO MATCH'));
    } catch (e) {
      steps.push('Step 3: ❌ Password verification FAILED: ' + e.message);
    }

    // Step 4: Create user in DB
    steps.push('Step 4: Creating user in DB...');
    let userId;
    try {
      const result = await sql`
        INSERT INTO auth_users (name, email, "emailVerified", image, gender, dob, country)
        VALUES (${name}, ${email}, null, '/avatars/male.jpg', 'Male', '2000-01-01', 'Egypt')
        RETURNING id
      `;
      userId = result[0].id;
      steps.push('Step 4: ✅ User created with ID: ' + userId);
    } catch (e) {
      steps.push('Step 4: ❌ User creation FAILED: ' + e.message);
      return new Response(JSON.stringify({ success: false, steps, error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    // Step 5: Link account with hashed password
    steps.push('Step 5: Linking account...');
    try {
      await sql`
        INSERT INTO auth_accounts (
          "userId", provider, type, "providerAccountId", 
          access_token, expires_at, refresh_token, id_token, 
          scope, session_state, token_type, password
        ) VALUES (
          ${userId}, 'credentials', 'credentials', ${String(userId)},
          null, null, null, null,
          null, null, null, ${hashedPassword}
        )
      `;
      steps.push('Step 5: ✅ Account linked successfully');
    } catch (e) {
      steps.push('Step 5: ❌ Account linking FAILED: ' + e.message);
      // Clean up the user we created
      await sql`DELETE FROM auth_users WHERE id = ${userId}`;
      return new Response(JSON.stringify({ success: false, steps, error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    // Step 6: Clean up test data
    steps.push('Step 6: Cleaning up test data...');
    try {
      await sql`DELETE FROM auth_accounts WHERE "userId" = ${userId}`;
      await sql`DELETE FROM auth_users WHERE id = ${userId}`;
      steps.push('Step 6: ✅ Cleanup done');
    } catch (e) {
      steps.push('Step 6: ⚠️ Cleanup failed: ' + e.message);
    }

    // Step 7 removed because Vite static analysis fails when package is uninstalled

    return new Response(JSON.stringify({ 
      success: true, 
      steps,
      message: 'All signup steps passed! The issue is likely in Auth.js flow itself.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      steps,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
}
