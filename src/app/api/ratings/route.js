import sql from '../utils/sql';
import { getContext } from 'hono/context-storage';
import { getToken } from '@auth/core/jwt';

// Submit a rating (User)
export async function POST(req) {
  const c = getContext();
  try {
    const token = await getToken({
      req: c.req.raw,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.AUTH_URL?.startsWith('https'),
    });
    
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await req.json();
    const { ticket_id, rating, comment } = body;
    const user_id = token.sub || token.email;

    if (!ticket_id || !rating) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    await sql`
      INSERT INTO ticket_ratings (ticket_id, user_id, rating, comment)
      VALUES (${ticket_id}, ${user_id}, ${rating}, ${comment || null})
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// Get ratings or delete ratings (Admin)
export async function GET(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader.split(" ")[1] !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const ratings = await sql`
      SELECT r.*, u.name as user_name, u.email as user_email, t.subject as ticket_subject
      FROM ticket_ratings r
      LEFT JOIN auth_users u ON r.user_id = u.id::TEXT OR r.user_id = u.email
      LEFT JOIN support_tickets t ON r.ticket_id = t.id
      ORDER BY r.created_at DESC
    `;
    return new Response(JSON.stringify({ ratings }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader.split(" ")[1] !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await req.json();
    if (body.action === 'delete_all') {
      await sql`DELETE FROM ticket_ratings`;
    } else if (body.id) {
      await sql`DELETE FROM ticket_ratings WHERE id = ${body.id}`;
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
