import sql from '../../utils/sql';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return new Response(JSON.stringify({ error: 'Email and OTP are required' }), { status: 400 });
    }

    const safeEmail = email.toLowerCase().trim();
    const safeOtp = otp.trim();

    const result = await sql`
      SELECT *, expires::text as expires_str FROM auth_verification_token
      WHERE identifier = ${safeEmail} AND token = ${safeOtp}
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid verification code' }), { status: 400 });
    }

    const tokenRecord = result[0];

    // Safely parse the expiration date by treating the DB string as UTC
    // postgres returns 'YYYY-MM-DD HH:mm:ss.ms' for text cast of timestamp
    const safeExpiresString = tokenRecord.expires_str.replace(' ', 'T') + 'Z';
    const expiresDate = new Date(safeExpiresString);

    if (new Date() > expiresDate) {
      return new Response(JSON.stringify({ error: 'Verification code expired' }), { status: 400 });
    }

    // Optional: Delete the token after successful verification
    await sql`DELETE FROM auth_verification_token WHERE identifier = ${safeEmail}`;

    return new Response(JSON.stringify({ success: true, message: 'OTP verified successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return new Response(JSON.stringify({ error: 'Failed to verify OTP' }), { status: 500 });
  }
}
