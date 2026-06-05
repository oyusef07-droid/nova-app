import sql from '../../utils/sql';
import { getContext } from 'hono/context-storage';
import { getToken } from '@auth/core/jwt';

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

export async function GET(req) {
  const token = await getUser();
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const [user] = await sql`
      SELECT name, email, gender, dob, country, image 
      FROM auth_users 
      WHERE id = ${token.sub}
    `;

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
