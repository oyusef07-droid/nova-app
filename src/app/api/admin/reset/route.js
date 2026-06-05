import sql from '../../utils/sql';

function checkAdminAuth(req) {
  const auth = req.headers.get('Authorization');
  const validPassword = process.env.ADMIN_PASSWORD || "#Moka1041999Omar#";
  if (auth !== `Bearer ${validPassword}`) {
    return false;
  }
  return true;
}

export async function DELETE(req) {
  if (!checkAdminAuth(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    // Delete data from each table individually to avoid errors if a table doesn't exist
    const tables = [
      'ticket_messages',
      'support_tickets', 
      'site_visits'
    ];

    for (const table of tables) {
      try {
        await sql(`DELETE FROM ${table}`);
      } catch (e) {
        console.warn(`Table ${table} might not exist, skipping:`, e.message);
      }
    }

    // Try ratings table separately (might not exist)
    try {
      await sql`DELETE FROM ratings`;
    } catch (e) {
      console.warn('Ratings table might not exist, skipping');
    }

    // Try history table separately (might not exist)
    try {
      await sql`DELETE FROM history`;
    } catch (e) {
      console.warn('History table might not exist, skipping');
    }

    return new Response(JSON.stringify({ success: true, message: "All data has been reset successfully." }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Reset Error:", error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to reset data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
