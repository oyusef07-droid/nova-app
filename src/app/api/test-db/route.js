import sql from '../utils/sql';

export async function GET(req) {
  try {
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'auth_users' OR table_name = 'auth_accounts';
    `;
    
    // Also let's try a dummy insert and rollback
    let insertResult = null;
    try {
        const testEmail = 'test_' + Date.now() + '@test.com';
        const res = await sql`
          INSERT INTO auth_users (name, email, "emailVerified", image, gender, dob, country)
          VALUES ('test', ${testEmail}, null, 'img', 'Male', '2000-01-01', 'Egypt')
          RETURNING id
        `;
        const userId = res[0].id;
        
        await sql`
          INSERT INTO auth_accounts (
            "userId", provider, type, "providerAccountId", access_token, 
            expires_at, refresh_token, id_token, scope, session_state, token_type, password
          ) VALUES (
            ${userId}, 'credentials', 'credentials', ${String(userId)}, null, 
            null, null, null, null, null, null, 'pass'
          )
        `;
        
        // Clean up
        await sql`DELETE FROM auth_users WHERE id = ${userId}`;
        
        insertResult = 'Insert successful!';
    } catch (e) {
      insertResult = 'Insert failed: ' + e.message;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      schema: result,
      insertTest: insertResult
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
}
