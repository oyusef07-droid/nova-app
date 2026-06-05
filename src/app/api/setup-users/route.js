import sql from '../utils/sql';

export async function GET(req) {
  try {
    // Add columns to auth_users table
    await sql`
      ALTER TABLE auth_users 
      ADD COLUMN IF NOT EXISTS gender TEXT,
      ADD COLUMN IF NOT EXISTS dob TEXT,
      ADD COLUMN IF NOT EXISTS country TEXT
    `;
    
    return new Response(JSON.stringify({ success: true, message: 'Columns added successfully to auth_users' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
