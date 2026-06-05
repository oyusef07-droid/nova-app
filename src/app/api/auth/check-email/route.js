import sql from '../../utils/sql';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const safeEmail = email.toLowerCase().trim();

    const result = await sql`SELECT id FROM auth_users WHERE email = ${safeEmail}`;

    if (result.length > 0) {
      return new Response(JSON.stringify({ exists: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ exists: false }), { status: 200 });
  } catch (error) {
    console.error('Error checking email:', error);
    return new Response(JSON.stringify({ error: 'Failed to check email' }), { status: 500 });
  }
}
