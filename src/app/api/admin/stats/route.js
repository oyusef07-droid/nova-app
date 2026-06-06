import sql from '../../utils/sql';

function checkAdminAuth(req) {
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
    // 1. Total Visits
    const totalResult = await sql`SELECT COUNT(*) as count FROM site_visits`;
    const totalVisits = parseInt(totalResult[0]?.count || 0, 10);

    // 2. Today Visits
    const todayResult = await sql`
      SELECT COUNT(*) as count 
      FROM site_visits 
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    const todayVisits = parseInt(todayResult[0]?.count || 0, 10);

    // 3. Month Visits
    const monthResult = await sql`
      SELECT COUNT(*) as count 
      FROM site_visits 
      WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    const monthVisits = parseInt(monthResult[0]?.count || 0, 10);

    // 4. Active Users (in the last 5 minutes)
    const activeResult = await sql`
      SELECT COUNT(DISTINCT ip_hash) as count 
      FROM site_visits 
      WHERE created_at >= NOW() - INTERVAL '5 minutes'
    `;
    const activeUsers = parseInt(activeResult[0]?.count || 0, 10);

    return new Response(JSON.stringify({
      totalVisits,
      todayVisits,
      monthVisits,
      activeUsers
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Stats Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
