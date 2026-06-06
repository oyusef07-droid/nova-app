// NOVA — Universal link analyzer

import { scrapeMovieSite } from './puppeteer_engine.js';

function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("mycima") || u.includes("wecima") || u.includes("egybest") || u.includes("egbest") || u.includes("akwam") || u.includes("fasel") || u.includes("fushaar") || u.includes("cima4u") || u.includes("shahid") || u.includes("moviz") || u.includes("cimalight")) return "moviesite";
  if (
    u.includes("facebook.com") ||
    u.includes("fb.watch") ||
    u.includes("fb.com")
  )
    return "facebook";
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

// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
// 1. TikTok via tikwm.com
// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
async function fetchTikTok(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://www.tikwm.com/",
      },
      body: `url=${encodeURIComponent(url)}&hd=1`,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`TikWM returned ${res.status}`);
    const data = await res.json();
    if (data?.code !== 0 || !data?.data) {
      throw new Error(data?.msg || "TikTok extraction failed");
    }
    const d = data.data;
    const formats = [];
    if (d.hdplay)
      formats.push({
        label: "HD (No watermark)",
        url: d.hdplay.startsWith("http") ? d.hdplay : `https://www.tikwm.com${d.hdplay}`,
        type: "video",
        size: d.hd_size ? `${(d.hd_size / 1024 / 1024).toFixed(1)} MB` : null,
        quality: "HD",
      });
    if (d.play)
      formats.push({
        label: "SD (No watermark)",
        url: d.play.startsWith("http") ? d.play : `https://www.tikwm.com${d.play}`,
        type: "video",
        size: d.size ? `${(d.size / 1024 / 1024).toFixed(1)} MB` : null,
        quality: "SD",
      });
    if (d.wmplay)
      formats.push({
        label: "With watermark",
        url: d.wmplay.startsWith("http") ? d.wmplay : `https://www.tikwm.com${d.wmplay}`,
        type: "video",
        size: d.wm_size ? `${(d.wm_size / 1024 / 1024).toFixed(1)} MB` : null,
        quality: "SD",
      });
    if (d.music)
      formats.push({
        label: "Audio MP3",
        url: d.music.startsWith("http") ? d.music : `https://www.tikwm.com${d.music}`,
        type: "audio",
        size: null,
        quality: "128kbps",
      });
    if (Array.isArray(d.images) && d.images.length > 0) {
      d.images.forEach((img, i) =>
        formats.push({ label: `Image ${i + 1}`, url: img, type: "image", size: null, quality: "Original" })
      );
    }
    return {
      title: d.title || "TikTok Video",
      author: d.author?.nickname || d.author?.unique_id || null,
      duration: d.duration || null,
      views: d.play_count || null,
      thumbnail: d.cover ? (d.cover.startsWith("http") ? d.cover : `https://www.tikwm.com${d.cover}`) : null,
      sourceUrl: url,
      platform: { id: "tiktok", name: "TikTok" },
      formats,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
// 2. YouTube via Piped (primary) + Invidious (fallback)
// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
// Verified working instances (tested 2026-06-01)
const PIPED_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.tokhmi.xyz",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.leptons.xyz",
];

function extractYouTubeId(url) {
  const m = url.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

async function fetchYouTubeViaPiped(videoId) {
  let lastError = null;
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${instance}/streams/${videoId}`, {
        signal: controller.signal,
        headers: { "User-Agent": "NOVA-Downloader/2.0", Accept: "application/json" },
      });
      clearTimeout(timeout);
      if (!res.ok) { lastError = new Error(`${instance} returned ${res.status}`); continue; }
      const data = await res.json();
      const formats = [];
      const videoStreams = data.videoStreams || [];
      const audioStreams = data.audioStreams || [];
      videoStreams.filter((s) => !s.videoOnly).forEach((s) =>
        formats.push({ label: `${s.quality}`, url: s.url, type: "video", size: null, quality: s.quality })
      );
      videoStreams.filter((s) => s.videoOnly).slice(0, 3).forEach((s) =>
        formats.push({ label: `${s.quality} (video only)`, url: s.url, type: "video", size: null, quality: s.quality })
      );
      const bestAudio = [...audioStreams].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      if (bestAudio) {
        const kbps = Math.round((bestAudio.bitrate || 128000) / 1000);
        formats.push({ label: `Audio ${kbps}kbps`, url: bestAudio.url, type: "audio", size: null, quality: `${kbps}kbps` });
      }
      if (formats.length === 0) { lastError = new Error("No formats from Piped"); continue; }
      return {
        title: data.title || "YouTube Video",
        author: data.uploader || null,
        duration: data.duration || null,
        views: data.views || null,
        thumbnail: data.thumbnailUrl || null,
        formats,
      };
    } catch (err) {
      lastError = err;
      console.error(`Piped ${instance} failed:`, err.message);
    }
  }
  throw lastError || new Error("All Piped instances unavailable");
}

// Cobalt community instances (verified 2026-06-01 from cobalt.directory)
// These support YouTube + most platforms at 87ظô96% service coverage
const COBALT_INSTANCES = [
  "https://apicobalt.mgytr.top",
  "https://cobaltapi.kittycat.boo",
  "https://dog.kittycat.boo",
  "https://melon.clxxped.lol",
  "https://nuko-c.meowing.de",
];

// cobalt v10 API ظ¤ returns tunnel URL or picker
async function fetchViaCobalt(url, options = {}) {
  let lastError = null;
  const body = JSON.stringify({ url, videoQuality: "1080", ...options });

  for (const instance of COBALT_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`${instance}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = new Error(`${instance} returned ${res.status}: ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await res.json();

      if (data.status === "error") {
        lastError = new Error(data.error?.code || data.text || "Cobalt error");
        continue;
      }

      // "tunnel" status ظْ single direct download
      if (data.status === "tunnel" && data.url) {
        return { tunnelUrl: data.url, filename: data.filename || null };
      }

      // "redirect" status ظْ direct CDN URL
      if (data.status === "redirect" && data.url) {
        return { tunnelUrl: data.url, filename: data.filename || null };
      }

      // "picker" status ظْ multiple items (e.g. Instagram carousel)
      if (data.status === "picker" && Array.isArray(data.picker)) {
        return { picker: data.picker };
      }

      lastError = new Error(`Unexpected cobalt status: ${data.status}`);
    } catch (err) {
      lastError = err;
      console.error(`Cobalt ${instance} failed:`, err.message);
    }
  }
  throw lastError || new Error("All Cobalt instances unavailable");
}

async function fetchYouTube(url) {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  // Try Piped first (gives structured format list)
  try {
    const result = await fetchYouTubeViaPiped(videoId);
    const hasAudio = result.formats.some(f => f.type === "audio");
    if (!hasAudio) {
      throw new Error("Piped returned no audio streams");
    }
    return { ...result, sourceUrl: url, platform: { id: "youtube", name: "YouTube" } };
  } catch (pipedErr) {
    console.error("Piped failed or missing audio, trying Cobalt for YouTube:", pipedErr.message);
  }

  try {
    // Fallback: Cobalt ظ¤ fetch multiple qualities
    const [res1080, res720, resAudio] = await Promise.all([
      fetchViaCobalt(url, { videoQuality: "1080" }).catch(() => null),
      fetchViaCobalt(url, { videoQuality: "720" }).catch(() => null),
      fetchViaCobalt(url, { downloadMode: "audio" }).catch(() => null),
    ]);

    const formats = [];
    const addedUrls = new Set();

    function processResult(res, defaultLabel, defaultType, defaultQuality) {
      if (!res || !res.tunnelUrl || addedUrls.has(res.tunnelUrl)) return;
      addedUrls.add(res.tunnelUrl);
      
      let type = defaultType;
      let label = defaultLabel;
      const fn = (res.filename || "").toLowerCase();
      
      if (/\.(jpg|jpeg|png|webp|gif)$/.test(fn)) {
        type = "image";
        label = "Image";
      } else if (/\.(mp3|wav|m4a|ogg)$/.test(fn)) {
        type = "audio";
        label = label.includes("Audio") ? label : "Audio";
      }
      
      formats.push({ label, url: res.tunnelUrl, type, size: null, quality: defaultQuality });
    }

    processResult(res1080, "HD Quality (1080p)", "video", "1080p");
    processResult(res720, "SD Quality (720p)", "video", "720p");
    processResult(resAudio, "Audio MP3", "audio", "Best");

    if (formats.length === 0) {
      // One last try
      const fallback = await fetchViaCobalt(url);
      if (fallback.tunnelUrl) {
        formats.push({ label: "Best quality", url: fallback.tunnelUrl, type: "video", size: null, quality: "Best" });
      } else {
        throw new Error("No formats from Cobalt");
      }
    }

    const bestResult = res1080 || res720 || resAudio || {};
    return {
      title: bestResult.filename?.replace(/\.[^.]+$/, "") || "YouTube Video",
      author: null,
      duration: null,
      views: null,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      sourceUrl: url,
      platform: { id: "youtube", name: "YouTube" },
      formats,
    };
  } catch (cobaltErr) {
    throw new Error(
      `YouTube extraction failed. All services are currently unavailable. Please try again in a few minutes.`,
    );
  }
}

// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
// 3. Universal handler via Cobalt for other platforms
// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
async function fetchViaCobalUniversal(url, platformId) {
  const platformName = PLATFORM_NAMES[platformId] || "Media";
  const formats = [];
  const isAudio = url.includes("soundcloud");

  if (isAudio) {
    const audioResult = await fetchViaCobalt(url);
    if (audioResult.tunnelUrl) {
      formats.push({ label: "Audio", url: audioResult.tunnelUrl, type: "audio", size: null, quality: "Best" });
    }
  } else {
    // Fetch multiple qualities concurrently to provide options
    const [res1080, res720, resAudio] = await Promise.all([
      fetchViaCobalt(url, { videoQuality: "1080" }).catch(() => null),
      fetchViaCobalt(url, { videoQuality: "720" }).catch(() => null),
      fetchViaCobalt(url, { downloadMode: "audio" }).catch(() => null),
    ]);

    const addedUrls = new Set();

    function processResult(res, defaultLabel, defaultType, defaultQuality) {
      if (!res || !res.tunnelUrl || addedUrls.has(res.tunnelUrl)) return;
      addedUrls.add(res.tunnelUrl);
      
      let type = defaultType;
      let label = defaultLabel;
      const fn = (res.filename || "").toLowerCase();
      
      if (/\.(jpg|jpeg|png|webp|gif)$/.test(fn)) {
        type = "image";
        label = "Image";
      } else if (/\.(mp3|wav|m4a|ogg)$/.test(fn)) {
        type = "audio";
        label = label.includes("Audio") ? label : "Audio";
      }
      
      formats.push({ label, url: res.tunnelUrl, type, size: null, quality: defaultQuality });
    }

    processResult(res1080, "HD Quality (1080p/Best)", "video", "1080p");
    processResult(res720, "SD Quality (720p)", "video", "720p");
    processResult(resAudio, "Audio MP3", "audio", "Best");

    // Handle pickers (e.g. Instagram carousel) from the 1080 request
    if (res1080 && res1080.picker && res1080.picker.length > 0) {
      res1080.picker.forEach((item, i) => {
        const isPhoto = item.type === "photo";
        formats.push({
          label: isPhoto ? `Image ${i + 1}` : item.filename || `Video ${i + 1}`,
          url: item.url,
          type: isPhoto ? "image" : "video",
          size: null,
          quality: "Original",
        });
      });
    }
  }

  if (formats.length === 0) {
    // Try one last time with default parameters if everything failed
    const fallback = await fetchViaCobalt(url);
    if (fallback.tunnelUrl) {
      formats.push({ label: "Best quality", url: fallback.tunnelUrl, type: "video", size: null, quality: "Best" });
    } else if (fallback.picker && fallback.picker.length > 0) {
      fallback.picker.forEach((item, i) => {
        formats.push({
          label: item.type === "photo" ? `Image ${i + 1}` : `Video ${i + 1}`,
          url: item.url,
          type: item.type === "photo" ? "image" : "video",
          size: null,
          quality: "Original",
        });
      });
    } else {
      throw new Error("No media found");
    }
  }

  return {
    title: `${platformName} Media`,
    author: null,
    duration: null,
    views: null,
    thumbnail: null,
    sourceUrl: url,
    platform: { id: platformId, name: platformName },
    formats,
  };
}

// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
// 4. SnapAny fallback (may return 404 sometimes)
// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
async function fetchSnapAny(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("https://api.snapany.com/v1/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Origin: "https://snapany.com",
        Referer: "https://snapany.com/",
      },
      body: JSON.stringify({ link: url }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`SnapAny returned ${res.status}`);
    const data = await res.json();
    if (!data?.medias || data.medias.length === 0) throw new Error("No media found");
    const formats = [];
    data.medias.forEach((m, i) => {
      if (!m.resource_url) return;
      const isAudio = m.media_type === "audio";
      const isImage = m.media_type === "image";
      formats.push({
        label: m.quality || (isAudio ? "Audio MP3" : isImage ? `Image ${i + 1}` : `Video ${i + 1}`),
        url: m.resource_url,
        type: isAudio ? "audio" : isImage ? "image" : "video",
        size: null,
        quality: m.quality || null,
      });
    });
    return {
      title: data.text || "Media",
      author: null,
      duration: null,
      views: null,
      thumbnail: data.preview_url || data.medias[0]?.preview_url || null,
      sourceUrl: url,
      formats,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
// 5. Pinterest RapidAPI handler
// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
async function fetchPinterestRapidAPI(url) {
  let lastError = null;
  // Try up to 3 times because the free RapidAPI sometimes fails randomly
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest?url=${encodeURIComponent(url)}`, {
        headers: {
          'x-rapidapi-host': 'pinterest-video-and-image-downloader.p.rapidapi.com',
          'x-rapidapi-key': '6cb56889e6mshb4cd55069960409p1d94dcjsn7df22dc24882'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      // If rate limited, wait and retry
      if (res.status === 429) {
        throw new Error("Rate limited (429)");
      }
      if (!res.ok) throw new Error(`Pinterest API returned ${res.status}`);
      
      const data = await res.json();
      if (!data?.data) throw new Error("No Pinterest data found in response");
      
      const d = data.data;
      const formats = [];
      const addedUrls = new Set();

      const addFormat = (label, u, type, quality) => {
        if (!u || addedUrls.has(u)) return;
        formats.push({ label, url: u, type, size: null, quality });
        addedUrls.add(u);
      };

      // Extract videos from story pins
      if (d.story_pin_data?.pages) {
        d.story_pin_data.pages.forEach((page) => {
          if (page.blocks) {
            page.blocks.forEach((block) => {
              if (block.type === 'story_pin_video_block' && block.video?.video_list) {
                 Object.values(block.video.video_list).forEach((v) => {
                   addFormat('Video (MP4)', v.url, 'video', 'HD');
                 });
              }
            });
          }
          if (page.image?.images?.originals?.url) {
             addFormat('Image (Original)', page.image.images.originals.url, 'image', 'HD');
          }
        });
      }
      
      // Extract direct videos
      if (d.videos?.video_list) {
         Object.values(d.videos.video_list).forEach((v) => {
           addFormat('Video (MP4)', v.url, 'video', 'HD');
         });
      }

      // Extract main images
      if (d.images?.orig?.url) {
         addFormat('Image', d.images.orig.url, 'image', 'Original');
      } else if (d.image_medium_url) {
         addFormat('Image', d.image_medium_url, 'image', 'Medium');
      }

      if (formats.length === 0) throw new Error("Could not parse media from Pinterest API");

      return {
        title: d.title || d.seo_title || "Pinterest Media",
        author: d.pinner?.full_name || d.pinner?.username || "Pinterest",
        thumbnail: d.image_medium_url || null,
        sourceUrl: url,
        platform: { id: "pinterest", name: "Pinterest" },
        formats
      };
    } catch(err) {
      clearTimeout(timeout);
      lastError = err;
      // Wait for 1.5s before retrying
      if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw lastError;
}

// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
// 6. Pinterest Direct HTML Scraper (custom server logic)
// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
async function fetchPinterestScraper(url) {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  async function fetchPage(targetUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'Cache-Control': 'no-cache',
          'Referer': 'https://www.google.com/',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Pinterest page returned ${res.status}`);
      return { html: await res.text(), finalUrl: res.url };
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  function decodeHtml(str) {
    return str
      .replace(/&amp;/g, '&')
      .replace(/\\u002F/g, '/')
      .replace(/\//g, '/');
  }

  function extractMedia(html, videoThumbFallback) {
    const items = [];
    const seenHashes = new Set();

    // Get og:image for video thumbnails
    let videoThumb = videoThumbFallback || null;
    const ogImgMatch = html.match(/property="og:image"\s+content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)"\s+property="og:image"/i);
    if (ogImgMatch) videoThumb = decodeHtml(ogImgMatch[1]);

    function add(rawUrl, type) {
      if (!rawUrl || rawUrl.length < 20) return;
      const cleaned = rawUrl.split('\\')[0].split('"')[0];
      const urlParts = cleaned.split('/');
      const filePart = urlParts[urlParts.length - 1].split('.')[0];
      const hash = filePart.length > 10 ? filePart : cleaned;
      if (seenHashes.has(hash)) return;
      seenHashes.add(hash);
      items.push({
        label: type === 'video' ? 'Video (MP4)' : 'Image (Original)',
        url: cleaned,
        type,
        thumb: type === 'image' ? cleaned : videoThumb,
        size: null,
        quality: 'HD',
      });
    }

    // Videos first
    const ogVid = html.match(/property="og:video(?::url)?"\s+content="([^"]+)"/i) ||
                  html.match(/content="([^"]+)"\s+property="og:video"/i);
    if (ogVid) add(decodeHtml(ogVid[1]), 'video');

    const vids = [...html.matchAll(/https?:\/\/[^"'\s<>]+\.(?:mp4|mov|webm)[^"'\s<>]{0,50}/gi)];
    vids.forEach(m => add(m[0], 'video'));

    // Original quality images
    const origImgs = [...html.matchAll(/https?:\/\/i\.pinimg\.com\/originals\/[^"'\s<>]+\.(?:jpg|jpeg|png|gif|webp)/gi)];
    origImgs.forEach(m => add(m[0], 'image'));

    // 736x fallback images
    const imgs736 = [...html.matchAll(/https?:\/\/i\.pinimg\.com\/736x\/[^"'\s<>]+\.(?:jpg|jpeg|png|gif|webp)/gi)];
    imgs736.forEach(m => add(m[0], 'image'));

    return items;
  }

  // Resolve pin.it short links
  let finalUrl = url;
  if (url.includes('pin.it')) {
    const { finalUrl: resolved } = await fetchPage(url);
    finalUrl = resolved;
  }

  const { html } = await fetchPage(finalUrl);

  // Get title from og:title or title tag
  const titleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i) ||
                     html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? decodeHtml(titleMatch[1]).replace(' | Pinterest', '').trim() : 'Pinterest Media';

  // Get thumbnail
  const thumbMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);
  const thumbnail = thumbMatch ? decodeHtml(thumbMatch[1]) : null;

  const formats = extractMedia(html, thumbnail);

  if (formats.length === 0) throw new Error('No media found by scraper');

  return {
    title,
    author: null,
    duration: null,
    views: null,
    thumbnail,
    sourceUrl: finalUrl,
    platform: { id: 'pinterest', name: 'Pinterest' },
    formats,
  };
}

// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
// 7. Instagram Railway Fallback
// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
async function fetchInstagramRailway(url) {
  const RAILWAY_API = "https://instagram-viewer-production-b7e8.up.railway.app/api/fetch"; 
  const res = await fetch(`${RAILWAY_API}?url=${encodeURIComponent(url)}`);
  
  if (!res.ok) throw new Error(`Railway Instagram API failed with status ${res.status}`);
  const data = await res.json();
  
  if (!data.success) throw new Error(data.error || "Railway fetch failed");
  
  const formats = [];
  if (data.data && data.data.mediaList) {
    data.data.mediaList.forEach(m => {
      formats.push({
        label: m.type === 'video' ? `Video ${m.index} (MP4)` : `Image ${m.index}`,
        url: m.url,
        type: m.type,
        size: null,
        quality: m.type === 'video' ? 'HD' : 'Original',
        thumb: m.thumb || data.data.mediaList[0]?.thumb || null
      });
    });
  }

  if (formats.length === 0) throw new Error("No media formats returned by Railway API");

  return {
    title: data.data.caption || "Instagram Media",
    author: data.data.username || null,
    thumbnail: data.data.mediaList?.[0]?.thumb || null,
    duration: null,
    views: data.data.likeCount || null,
    sourceUrl: data.data.postUrl || url,
    platform: { id: "instagram", name: "Instagram" },
    formats
  };
}

// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤
// Main POST handler
// ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤ظ¤

// ───────────────────────────────────────────────
// NOVA Custom API Load Balancers
// ───────────────────────────────────────────────
// Layer 1: User's Custom Server (Desktop)
const USER_CUSTOM_SERVER = 'https://media-downloader-moka-production.up.railway.app';

// Layer 2: Agent's Custom Server (Railway)
const NOVA_API_SERVERS = [
  'https://nova-downloader-api-production.up.railway.app'
];

async function fetchFromCustomServer(url, serverUrl) {
  if (serverUrl.includes('YOUR-CUSTOM-SERVER-URL')) throw new Error('Custom server URL not set yet');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const res = await fetch(`${serverUrl}/api/fetch?url=${encodeURIComponent(url)}`, {
    signal: controller.signal,
    headers: { 'Accept': 'application/json' }
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  const data = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'Server returned unsuccessful response');
  return data.data;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const rawUrl = (body?.url || '').trim();

    if (!rawUrl) return Response.json({ error: 'Missing URL' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });

    let cleanUrl = rawUrl;
    const urlMatch = cleanUrl.match(/https?:\/\/[^\s]+/);
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
         { error: `عذراً، جميع خوادم ${pName} مشغولة حالياً أو تم حظر الرابط. جرب مرة أخرى لاحقاً.` },
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
