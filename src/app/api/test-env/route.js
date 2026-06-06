export async function GET() {
  return new Response(JSON.stringify({
    googleId: process.env.AUTH_GOOGLE_ID || 'missing',
    googleIdLength: (process.env.AUTH_GOOGLE_ID || '').length,
    expectedLength: "633432477274-na8o3gt4r8lkrbrc048gvujcgjmc6ngd.apps.googleusercontent.com".length
  }), { headers: { 'Content-Type': 'application/json' } });
}
