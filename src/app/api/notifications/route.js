import sql from '../utils/sql';
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
  const user = await getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const userId = user.sub || user.email;
    const notifications = await sql`
      SELECT * FROM notifications 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    
    const unreadCount = notifications.filter(n => !n.is_read).length;
    
    return new Response(JSON.stringify({ notifications, unreadCount }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PUT(req) {
  const user = await getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const userId = user.sub || user.email;
    // Mark all as read
    await sql`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE user_id = ${userId} AND is_read = FALSE
    `;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
