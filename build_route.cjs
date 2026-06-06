const fs = require('fs');

const code = fs.readFileSync('route_old.js', 'utf8');

const newPostHandler = `// ───────────────────────────────────────────────
// NOVA Custom API Load Balancers
// ───────────────────────────────────────────────
// Layer 1: User's Custom Server (Desktop)
const USER_CUSTOM_SERVER = 'https://YOUR-CUSTOM-SERVER-URL.com';

// Layer 2: Agent's Custom Server (Railway)
const NOVA_API_SERVERS = [
  'https://nova-downloader-api-production.up.railway.app'
];

async function fetchFromCustomServer(url, serverUrl) {
  if (serverUrl.includes('YOUR-CUSTOM-SERVER-URL')) throw new Error('Custom server URL not set yet');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const res = await fetch(\`\${serverUrl}/api/fetch?url=\${encodeURIComponent(url)}\`, {
    signal: controller.signal,
    headers: { 'Accept': 'application/json' }
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(\`Server returned \${res.status}\`);
  const data = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'Server returned unsuccessful response');
  return data.data;
}

// ───────────────────────────────────────────────
// Main POST handler (4-Layer Fallback)
// ───────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const rawUrl = (body?.url || '').trim();

    if (!rawUrl) return Response.json({ error: 'Missing URL' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });

    let cleanUrl = rawUrl;
    const urlMatch = cleanUrl.match(/https?:\\/\\/[^\\s]+/);
    if (urlMatch) cleanUrl = urlMatch[0];
    else if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) cleanUrl = 'https://' + cleanUrl;

    try { new URL(cleanUrl); } catch {
      return Response.json({ error: 'Invalid URL format' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const platformId = detectPlatform(cleanUrl);

    if (cleanUrl.toLowerCase().includes('whatsapp.com')) {
      return Response.json(
        { error: 'WhatsApp Status cannot be downloaded — it uses end-to-end encryption with no public links.', code: 'UNSUPPORTED_WHATSAPP' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    if (platformId === 'facebook' && (cleanUrl.includes('photo.php') || cleanUrl.includes('/photo') || cleanUrl.includes('/photos/') || cleanUrl.includes('/posts/') || cleanUrl.includes('/stories/') || cleanUrl.includes('story.php'))) {
      return Response.json(
        { error: 'عذراً، بسبب سياسات فيسبوك لا يمكن سحب الصور والقصص عبر الموقع. (تحميل فيديوهات وريلز فيسبوك ما زال مدعوماً!)' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    let result = null;
    let errors = [];

    if (platformId === 'moviesite') {
       result = await scrapeMovieSite(cleanUrl);
       return Response.json(result, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // LAYER 1: User's Custom Server
    try {
      result = await fetchFromCustomServer(cleanUrl, USER_CUSTOM_SERVER);
    } catch(e) { errors.push('L1: ' + e.message); }

    // LAYER 2: Agent's Railway Server
    if (!result) {
       for (const server of NOVA_API_SERVERS) {
          try {
             result = await fetchFromCustomServer(cleanUrl, server);
             break;
          } catch(e) { errors.push('L2: ' + e.message); }
       }
    }

    // LAYER 3: Original Code (Cobalt, TikWM, SnapAny, Piped)
    if (!result) {
        try {
          if (platformId === 'tiktok') {
            result = await fetchTikTok(cleanUrl);
          } else if (platformId === 'youtube') {
            result = await fetchYouTube(cleanUrl);
          } else {
            result = await fetchViaCobalUniversal(cleanUrl, platformId);
          }
        } catch(e) { 
          errors.push('L3: ' + e.message); 
          try {
             if (platformId !== 'youtube') {
                result = await fetchSnapAny(cleanUrl);
                if (result) result.platform = { id: platformId, name: PLATFORM_NAMES[platformId] };
             }
          } catch(e2) { errors.push('L3_Snap: ' + e2.message); }
        }
    }

    // LAYER 4: Dedicated Servers (Pinterest RapidAPI, Instagram Railway API)
    if (!result) {
       if (platformId === 'pinterest') {
          try { result = await fetchPinterestRapidAPI(cleanUrl); }
          catch(e) {
             try { result = await fetchPinterestScraper(cleanUrl); } catch(e2) { errors.push('L4_Pin: ' + e2.message); }
          }
       } else if (platformId === 'instagram') {
          try { result = await fetchInstagramRailway(cleanUrl); }
          catch(e) { errors.push('L4_IG: ' + e.message); }
       }
    }

    // LAYER 5: Generic Web Scraper (Puppeteer)
    if (!result && (platformId === 'generic' || platformId === 'reddit' || platformId === 'vimeo' || platformId === 'dailymotion' || platformId === 'soundcloud' || platformId === 'twitch' || platformId === 'snapchat' || platformId === 'linkedin' || platformId === 'telegram' || platformId === 'threads')) {
        try {
           const genericFallback = await scrapeMovieSite(cleanUrl);
           if (genericFallback && genericFallback.formats) {
              result = genericFallback;
              result.platform = { id: 'generic', name: 'Web Link' };
           }
        } catch(e) {}
    }

    if (!result) {
       console.error('All layers failed for', cleanUrl, errors);
       const pName = PLATFORM_NAMES[platformId] || 'التطبيق المطلوب';
       return Response.json(
         { error: \`عذراً، جميع خوادم \${pName} مشغولة حالياً أو تم حظر الرابط. جرب مرة أخرى لاحقاً.\` },
         { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
       );
    }

    if (result && !result.platform) {
       result.platform = { id: platformId, name: PLATFORM_NAMES[platformId] || 'Media' };
    }

    return Response.json(result, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('Analysis Error:', err);
    return Response.json(
      { error: err.message || 'An error occurred' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
`;

const postIndex = code.indexOf('export async function POST(request) {');
if (postIndex === -1) {
  console.error('Could not find POST function in route_old.js');
  process.exit(1);
}

const beforePost = code.substring(0, code.lastIndexOf('// ───────────────────────────────────────────────', postIndex));

const finalCode = beforePost + '\n\n' + newPostHandler;

fs.writeFileSync('src/app/api/analyze/route.js', finalCode);
console.log('Successfully wrote multi-layer fallback to route.js');
