import sql from '../utils/sql';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    await sql`
      INSERT INTO site_visits (ip_hash)
      VALUES (${ipHash})
    `;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error tracking visit:", error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to track visit' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
