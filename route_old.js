// NOVA — Universal link analyzer

import { scrapeMovieSite } from './puppeteer_engine.js';

function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be") || u.includes("youtube.com/shorts")) return "youtube";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("mycima") || u.includes("wecima") || u.includes("egybest") || u.includes("egbest") || u.includes("akwam") || u.includes("fasel") || u.includes("fushaar") || u.includes("cima4u") || u.includes("shahid") || u.includes("moviz") || u.includes("cimalight")) return "moviesite";
  if (u.includes("facebook.com") || u.includes("fb.watch") || u.includes("fb.com")) return "facebook";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("pinterest.") || u.includes("pin.it")) return "pinterest";
  if (u.includes("reddit.com")) return "reddit";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes("dailymotion.com")) return "dailymotion";
  if (u.includes("twitch.tv")) return "twitch";
  if (u.includes("soundcloud.com")) return "soundcloud";
  if (u.includes("t.me") || u.includes("telegram.")) return "telegram";
  if (u.includes("snapchat.com")) return "snapchat";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("threads.net")) return "threads";
  return "generic";
}

const PLATFORM_NAMES = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  pinterest: "Pinterest",
  reddit: "Reddit",
  vimeo: "Vimeo",
  dailymotion: "Dailymotion",
  twitch: "Twitch",
  soundcloud: "SoundCloud",
  telegram: "Telegram",
  snapchat: "Snapchat",
  linkedin: "LinkedIn",
  threads: "Threads",
  moviesite: "Movies & TV",
  generic: "Web",
};

// ───────────────────────────────────────────────
// NOVA Custom API Load Balancer
// ───────────────────────────────────────────────
const NOVA_API_SERVERS = [
  "https://nova-downloader-api-production.up.railway.app",
  // "https://nova-api-fallback.onrender.com" // You can add the Render link here later!
];

async function fetchFromNovaAPI(url) {
  let lastError = null;

  for (const server of NOVA_API_SERVERS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
      
      const res = await fetch(`${server}/api/fetch?url=${encodeURIComponent(url)}`, {
        signal: controller.signal,
        headers: { "Accept": "application/json" }
      });
      clearTimeout(timeout);

      if (!res.ok) {
        lastError = new Error(`Nova API (${server}) returned ${res.status}`);
        continue; // Try next server
      }

      const data = await res.json();
      if (!data.success || !data.data) {
        lastError = new Error(data.error || "Nova API returned unsuccessful response");
        continue; // Try next server
      }

      // The Nova API already returns exactly what our frontend expects!
      return data.data;

    } catch (err) {
      lastError = err;
      console.error(`Nova API Server [${server}] failed:`, err.message);
    }
  }

  throw lastError || new Error("All Nova API servers are currently unavailable");
}

// ───────────────────────────────────────────────
// Main POST handler
// ───────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const rawUrl = (body?.url || "").trim();

    if (!rawUrl) return Response.json({ error: "Missing URL" }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });

    let cleanUrl = rawUrl;
    // Extract URL if it's mixed with text (e.g. from mobile share sheet)
    const urlMatch = cleanUrl.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      cleanUrl = urlMatch[0];
    } else if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    try {
      new URL(cleanUrl);
    } catch {
      return Response.json({ error: "Invalid URL format" }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const platformId = detectPlatform(cleanUrl);

    if (cleanUrl.toLowerCase().includes("whatsapp.com")) {
      return Response.json(
        { error: "WhatsApp Status cannot be downloaded — it uses end-to-end encryption with no public links.", code: "UNSUPPORTED_WHATSAPP" },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    if (platformId === "facebook" && (cleanUrl.includes("photo.php") || cleanUrl.includes("/photo") || cleanUrl.includes("/photos/") || cleanUrl.includes("/posts/") || cleanUrl.includes("/stories/") || cleanUrl.includes("story.php"))) {
      return Response.json(
        { error: "عذراً، بسبب سياسات فيسبوك لا يمكن سحب الصور والقصص (Stories) والمنشورات العادية عبر الموقع. يمكنك حفظ الصور مباشرة من فيسبوك بالضغط عليها مطولاً ثم 'حفظ'. (تحميل فيديوهات وريلز فيسبوك ما زال مدعوماً ويعمل بشكل طبيعي!)" },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    let result = null;

    try {
      if (platformId === "moviesite") {
         // Keep existing puppeteer scraper for movies
         result = await scrapeMovieSite(cleanUrl);
      } else {
         // Send EVERYTHING else to the new Nova API Server!
         result = await fetchFromNovaAPI(cleanUrl);
         
         // Override platform metadata if needed
         if (result) {
            result.platform = { id: platformId, name: PLATFORM_NAMES[platformId] || "Media" };
         }
      }
    } catch (err) {
      console.error(`Primary fetch failed for ${platformId}:`, err.message);
      
      // Fallback for Generic Web Sites
      if (platformId === "generic" || platformId === "reddit" || platformId === "vimeo" || platformId === "dailymotion" || platformId === "soundcloud" || platformId === "twitch" || platformId === "snapchat" || platformId === "linkedin" || platformId === "telegram" || platformId === "threads") {
          try {
             const genericFallback = await scrapeMovieSite(cleanUrl);
             if (genericFallback && genericFallback.formats) {
                result = genericFallback;
                result.platform = { id: "generic", name: "Web Link" };
             }
          } catch(e) {}
      }

      if (!result) {
         const pName = PLATFORM_NAMES[platformId] || "التطبيق المطلوب";
         return Response.json(
           { error: `عذراً، فشل التحميل من ${pName}: ${err.message}. تأكد من صحة الرابط أو حاول مرة أخرى.` },
           { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
         );
      }
    }

    return Response.json(result, { headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    console.error("Analysis Error:", err);
    return Response.json(
      { error: err.message || "An error occurred" },
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
