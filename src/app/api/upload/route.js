import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getContext } from 'hono/context-storage';
import { getToken } from '@auth/core/jwt';

export async function POST(req) {
  const c = getContext();
  try {
    const token = await getToken({
      req: c.req.raw,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.AUTH_URL?.startsWith('https'),
    });
    
    // Allow upload if user is authenticated OR if it's admin (admin has password check, but this is a general upload endpoint, so we might need to check headers for admin password too, but for simplicity, let's allow if they provide either a valid session or an admin password).
    const authHeader = req.headers.get("Authorization");
    const isAdmin = authHeader && authHeader.split(" ")[1] === process.env.ADMIN_PASSWORD;

    if (!token && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const ticketId = formData.get('ticket_id');
    const uploadType = formData.get('type') || 'ticket'; // 'ticket' or 'avatar'

    if (!file) {
      return new Response(JSON.stringify({ error: 'File is required' }), { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert file to Base64 to bypass Next.js static serving issues
    const mimeType = file.type || 'application/octet-stream';
    const base64String = `data:${mimeType};base64,${buffer.toString('base64')}`;

    return new Response(JSON.stringify({ success: true, url: base64String }), { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
