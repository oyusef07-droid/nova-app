import sql from '../../utils/sql';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return new Response(JSON.stringify({ error: 'Email and new password are required' }), { status: 400 });
    }

    const safeEmail = email.toLowerCase().trim();

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400 });
    }

    // Check if user exists
    const users = await sql`SELECT id FROM auth_users WHERE email = ${safeEmail}`;
    if (users.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const userId = users[0].id;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in auth_accounts
    const updateResult = await sql`
      UPDATE auth_accounts 
      SET password = ${hashedPassword} 
      WHERE "userId" = ${userId} AND provider = 'credentials'
    `;

    // If the user signed up via Google originally, they might not have a credentials account
    // We should probably insert one if it doesn't exist, but usually forgot password implies they had one.
    if (updateResult.length === 0) {
      // Just in case they didn't have a credentials account, we create one so they can login via email
      await sql`
        INSERT INTO auth_accounts (
          "userId", type, provider, "providerAccountId", password
        ) VALUES (
          ${userId}, 'credentials', 'credentials', ${String(userId)}, ${hashedPassword}
        ) ON CONFLICT DO NOTHING
      `;
    }

    return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error resetting password:', error);
    return new Response(JSON.stringify({ error: 'Failed to reset password' }), { status: 500 });
  }
}
