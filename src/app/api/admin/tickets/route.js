import sql from '../../utils/sql';
import { rm } from 'fs/promises';
import { join } from 'path';

// Simple middleware-like check
function checkAdminAuth(req) {
  // We'll pass ADMIN_PASSWORD in headers
  const auth = req.headers.get('Authorization');
  const validPassword = process.env.ADMIN_PASSWORD || "#Moka1041999Omar#";
  if (auth !== `Bearer ${validPassword}`) {
    return false;
  }
  return true;
}

export async function GET(req) {
  if (!checkAdminAuth(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const tickets = await sql`
      SELECT t.*, u.name as user_name, u.email as user_email, u.dob, u.country, u.gender, u.is_banned
      FROM support_tickets t
      LEFT JOIN auth_users u ON t.user_id = u.id::text OR t.user_id = u.email
      WHERE t.admin_deleted = false
      ORDER BY t.created_at DESC
    `;
    
    const messages = await sql`
      SELECT * FROM ticket_messages 
      ORDER BY created_at ASC
    `;

    return new Response(JSON.stringify({ tickets, messages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(req) {
  if (!checkAdminAuth(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await req.json();
    
    if (body.action === 'reply') {
      const { ticket_id, message } = body;
      
      const [msg] = await sql`
        INSERT INTO ticket_messages (ticket_id, sender_type, message)
        VALUES (${ticket_id}, 'admin', ${message})
        RETURNING *
      `;
      
      // Update ticket status
      await sql`
        UPDATE support_tickets SET status = 'answered' WHERE id = ${ticket_id}
      `;
      
      const [ticket] = await sql`SELECT * FROM support_tickets WHERE id = ${ticket_id}`;
      if (ticket) {
        // Insert notification for the user
        await sql`
          INSERT INTO notifications (user_id, title, message, link)
          VALUES (
            ${ticket.user_id}, 
            'رد جديد من الإدارة', 
            'قامت الإدارة بالرد على تذكرتك: ' || ${ticket.subject}, 
            '/contact?ticket_id=' || ${ticket.id}
          )
        `;
      }

      return new Response(JSON.stringify({ success: true, message: msg }), { status: 200 });
    }
    else if (body.action === 'mark_read') {
      const { ticket_id } = body;
      await sql`UPDATE support_tickets SET admin_unread_count = 0 WHERE id = ${ticket_id}`;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    else if (body.action === 'close') {
      const { ticket_id } = body;
      await sql`
        UPDATE support_tickets SET status = 'closed' WHERE id = ${ticket_id}
      `;
      
      try {
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'tickets', ticket_id.toString());
        await rm(uploadDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Error deleting media files:", e);
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    else if (body.action === 'reopen') {
      const { ticket_id } = body;
      await sql`
        UPDATE support_tickets SET status = 'open' WHERE id = ${ticket_id}
      `;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    else if (body.action === 'delete') {
      const { ticket_id, deleteType } = body;
      if (deleteType === 'both') {
        await sql`UPDATE support_tickets SET admin_deleted = true, user_deleted = true WHERE id = ${ticket_id}`;
      } else {
        await sql`UPDATE support_tickets SET admin_deleted = true WHERE id = ${ticket_id}`;
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    else if (body.action === 'bulk_delete') {
      const { ticket_ids, deleteType } = body;
      if (!Array.isArray(ticket_ids) || ticket_ids.length === 0) {
        return new Response(JSON.stringify({ error: 'No tickets selected' }), { status: 400 });
      }
      
      for (const tid of ticket_ids) {
        if (deleteType === 'both') {
          await sql`UPDATE support_tickets SET admin_deleted = true, user_deleted = true WHERE id = ${tid}`;
        } else {
          await sql`UPDATE support_tickets SET admin_deleted = true WHERE id = ${tid}`;
        }
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    else if (body.action === 'ban_user') {
      const { user_email, is_banned } = body;
      if (!user_email) return new Response(JSON.stringify({ error: 'User email required' }), { status: 400 });
      
      await sql`UPDATE auth_users SET is_banned = ${is_banned} WHERE email = ${user_email}`;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
