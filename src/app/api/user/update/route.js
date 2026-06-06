import sql from '../../utils/sql';
import { getContext } from 'hono/context-storage';
import { getToken } from '@auth/core/jwt';
import * as bcrypt from 'bcryptjs';

async function getUser() {
  const c = getContext();
  try {
    const token = await getToken({
      req: c.req.raw,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.AUTH_URL?.startsWith('https'),
    });
    return token ? token : null;
  } catch (err) {
    return null;
  }
}

export async function PUT(req) {
  const token = await getUser();
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const userId = token.sub; // The user ID

  try {
    const body = await req.json();
    const { name, dob, gender, country, newPassword } = body;

    // Update basic info in auth_users table
    await sql`
      UPDATE auth_users 
      SET 
        name = ${name !== undefined ? name : sql`name`},
        dob = ${dob !== undefined ? dob : sql`dob`},
        gender = ${gender !== undefined ? gender : sql`gender`},
        country = ${country !== undefined ? country : sql`country`}
      WHERE id = ${userId}
    `;

    // Handle password update if provided
    if (newPassword && newPassword.length >= 6) {
      const hash = await bcrypt.hash(newPassword, 10);
      
      // Check if user already has a credentials account
      const existingAccount = await sql`
        SELECT id FROM auth_accounts 
        WHERE "userId" = ${userId} AND provider = 'credentials'
      `;

      if (existingAccount.length > 0) {
        // Update existing password
        await sql`
          UPDATE auth_accounts 
          SET password = ${hash}
          WHERE "userId" = ${userId} AND provider = 'credentials'
        `;
      } else {
        // Create new credentials account so Google users can login via email
        // We need the user's email to ensure the credentials account makes sense
        const [userRecord] = await sql`SELECT email FROM auth_users WHERE id = ${userId}`;
        if (userRecord && userRecord.email) {
          await sql`
            INSERT INTO auth_accounts ("userId", provider, type, "providerAccountId", password)
            VALUES (${userId}, 'credentials', 'credentials', ${String(userId)}, ${hash})
          `;
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
