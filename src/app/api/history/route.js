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
  try {
    const token = await getUser();
    if (!token || !token.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const userId = parseInt(token.sub, 10);
    if (isNaN(userId)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const history = await sql`
      SELECT * FROM user_history 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    const mappedHistory = history.map(item => ({
      id: item.id.toString(),
      title: item.title,
      thumbnail: item.thumbnail,
      platform: {
        id: item.platform_id,
        name: item.platform_name
      },
      formatType: item.format_type,
      formatLabel: item.format_label,
      sourceUrl: item.source_url,
      downloadUrl: item.download_url,
      createdAt: item.created_at
    }));

    return new Response(JSON.stringify(mappedHistory), { status: 200 });
  } catch (error) {
    console.error('Error fetching history:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = await getUser();
    if (!token || !token.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const userId = parseInt(token.sub, 10);
    if (isNaN(userId)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    
    if (items.length === 0) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    for (const item of items) {
      if (!item.title && !item.platform) continue;
      
      // Delete older entry for the same source_url to prevent duplicates
      if (item.sourceUrl) {
        await sql`
          DELETE FROM user_history 
          WHERE user_id = ${userId} AND source_url = ${item.sourceUrl}
        `;
      }
      
      await sql`
        INSERT INTO user_history (
          user_id, title, thumbnail, platform_id, platform_name, 
          format_type, format_label, source_url, download_url
        ) VALUES (
          ${userId}, ${item.title || null}, ${item.thumbnail || null}, 
          ${item.platform?.id || null}, ${item.platform?.name || null},
          ${item.formatType || null}, ${item.formatLabel || null}, ${item.sourceUrl || null}, ${item.downloadUrl || null}
        )
      `;
    }

    // Enforce 10 items limit
    await sql`
      DELETE FROM user_history 
      WHERE user_id = ${userId} 
      AND id NOT IN (
        SELECT id FROM user_history 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC 
        LIMIT 10
      )
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error saving history:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const token = await getUser();
    if (!token || !token.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const userId = parseInt(token.sub, 10);
    if (isNaN(userId)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    if (itemId) {
      await sql`DELETE FROM user_history WHERE user_id = ${userId} AND id = ${parseInt(itemId, 10)}`;
    } else {
      await sql`DELETE FROM user_history WHERE user_id = ${userId}`;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error deleting history:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
