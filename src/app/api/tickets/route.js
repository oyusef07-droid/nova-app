import sql from '../utils/sql';
import { getContext } from 'hono/context-storage';
import { getToken } from '@auth/core/jwt';

// Helper to get authenticated user from Auth.js token
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
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const tickets = await sql`
      SELECT * FROM support_tickets 
      WHERE user_id = ${user.sub || user.email} AND user_deleted = false
      ORDER BY created_at DESC
    `;
    
    // Also fetch messages for these tickets
    const ticketIds = tickets.map(t => t.id);
    let messages = [];
    if (ticketIds.length > 0) {
      messages = await sql`
        SELECT * FROM ticket_messages 
        WHERE ticket_id = ANY(${ticketIds})
        ORDER BY created_at ASC
      `;
    }

    return new Response(JSON.stringify({ tickets, messages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await req.json();
    
    if (body.action === 'new_ticket') {
      const { subject, message } = body;
      const [ticket] = await sql`
        INSERT INTO support_tickets (user_id, subject, admin_unread_count)
        VALUES (${user.sub || user.email}, ${subject}, 1)
        RETURNING *
      `;
      
      const [msg] = await sql`
        INSERT INTO ticket_messages (ticket_id, sender_type, message)
        VALUES (${ticket.id}, 'user', ${message})
        RETURNING *
      `;

      let botReply = 'مرحباً بك! سيتم الرد عليك في أقرب وقت. يرجى الانتظار.';
      if (message === 'مشكلة فنية') {
        botReply = 'مرحباً بك! يرجى توضيح المشكلة الفنية بالتفصيل أو إرفاق صورة للمشكلة وسيقوم الدعم الفني بمساعدتك.';
      } else if (message === 'استفسار عام') {
        botReply = 'مرحباً بك! تفضل بطرح استفسارك وسنقوم بالرد عليك في أقرب وقت.';
      } else if (message === 'مراسلة الإدارة') {
        botReply = 'مرحباً بك! سيتم تحويلك إلى الإدارة في أقرب وقت. يرجى الانتظار.';
      }

      // Auto Welcome Bot Message
      const [botMsg] = await sql`
        INSERT INTO ticket_messages (ticket_id, sender_type, message)
        VALUES (${ticket.id}, 'admin', ${botReply})
        RETURNING *
      `;
      
      // Enforce 5 closed tickets limit
      await sql`
        DELETE FROM support_tickets 
        WHERE user_id = ${user.sub || user.email} AND status = 'closed'
        AND id NOT IN (
          SELECT id FROM support_tickets 
          WHERE user_id = ${user.sub || user.email} AND status = 'closed'
          ORDER BY created_at DESC 
          LIMIT 5
        )
      `;
      
      return new Response(JSON.stringify({ ticket, messages: [msg, botMsg] }), { status: 200 });
    } 
    else if (body.action === 'reply') {
      const { ticket_id, message, media_url, media_type } = body;
      
      // Ensure user owns ticket
      const [ticket] = await sql`SELECT * FROM support_tickets WHERE id = ${ticket_id} AND user_id = ${user.sub || user.email}`;
      if (!ticket) return new Response(JSON.stringify({ error: 'Ticket not found' }), { status: 404 });
      
      // Check 3 message limit
      const lastMessages = await sql`
        SELECT sender_type FROM ticket_messages 
        WHERE ticket_id = ${ticket_id} 
        ORDER BY created_at DESC LIMIT 3
      `;
      const userConsecutive = lastMessages.filter(m => m.sender_type === 'user').length;
      if (lastMessages.length === 3 && userConsecutive === 3) {
        return new Response(JSON.stringify({ error: 'لقد وصلت للحد الأقصى للرسائل (3). يرجى انتظار رد الإدارة.' }), { status: 403 });
      }

      const [msg] = await sql`
        INSERT INTO ticket_messages (ticket_id, sender_type, message, media_url, media_type)
        VALUES (${ticket_id}, 'user', ${message || ''}, ${media_url || null}, ${media_type || null})
        RETURNING *
      `;

      await sql`
        UPDATE support_tickets 
        SET admin_unread_count = admin_unread_count + 1, status = 'open' 
        WHERE id = ${ticket_id}
      `;
      
      return new Response(JSON.stringify({ message: msg }), { status: 200 });
    }
    else if (body.action === 'close_ticket') {
      const { ticket_id } = body;
      const [ticket] = await sql`SELECT * FROM support_tickets WHERE id = ${ticket_id} AND user_id = ${user.sub || user.email}`;
      if (!ticket) return new Response(JSON.stringify({ error: 'Ticket not found' }), { status: 404 });
      
      await sql`UPDATE support_tickets SET status = 'closed' WHERE id = ${ticket_id}`;
      
      // Delete media
      try {
        const { join } = await import('path');
        const { rm } = await import('fs/promises');
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'tickets', ticket_id.toString());
        await rm(uploadDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Error deleting media files:", e);
      }
      
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
