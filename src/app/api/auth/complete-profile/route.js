import sql from '../../utils/sql';
import bcrypt from 'bcryptjs';
import { getContext } from 'hono/context-storage';
import { getToken } from '@auth/core/jwt';

export async function POST(req) {
  const c = getContext();
  try {
    const token = await getToken({
      req: c.req.raw,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.AUTH_URL?.startsWith('https'),
    });
    
    if (!token || !token.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // We will use token.sub as the user ID instead of session.user.id
    const sessionId = token.sub;

    const body = await req.json();
    const { name, dob, country, gender, agreeToTerms, password } = body;

    if (!dob || !country || !agreeToTerms || !name || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400 });
    }

    const userId = parseInt(sessionId, 10);
    if (isNaN(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid session format. Please log out and log in again.' }), { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user personal info
    await sql`
      UPDATE auth_users 
      SET name = ${name}, dob = ${dob}, country = ${country}, gender = ${gender || null}
      WHERE id = ${userId}
    `;

    // Create a credentials account so the user can login via email/password in the future
    await sql`
      INSERT INTO auth_accounts (
        "userId", type, provider, "providerAccountId", password
      ) VALUES (
        ${userId}, 'credentials', 'credentials', ${String(userId)}, ${hashedPassword}
      ) ON CONFLICT DO NOTHING
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error updating profile:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
