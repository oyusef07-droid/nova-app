export async function scrapeMovieSite(url) {
  // On Vercel, Puppeteer is completely unsupported and crashes the serverless function.
  // We must not even include dynamic imports to it, otherwise Vercel bundles it and crashes with 500.
  throw new Error("عذراً، تحميل الأفلام لا يعمل على هذه الاستضافة المجانية السريعة. التحميل متاح فقط لمواقع السوشيال ميديا.");
  
  // The rest of this function will never be reached on Vercel.
  let browser = null;
  try {
    const apiKey = process.env.BROWSERLESS_API_KEY;
    
    // Connect to Browserless cloud if API key exists, otherwise run locally
    if (apiKey) {
      console.log('Connecting to Browserless.io cloud...');
      browser = await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${apiKey}&stealth=true`
      });
    } else {
      console.log('Launching local Puppeteer instance...');
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-software-rasterizer']
      });
    }
    
    const page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    const mediaUrls = new Set();
    
    // 1. Sniff Network
    page.on('response', response => {
      try {
        const resUrl = response.url();
        const type = response.headers()['content-type'] || '';
        if (resUrl.includes('.mp4') || resUrl.includes('.m3u8') || type.includes('video/mp4')) {
          mediaUrls.add(resUrl);
        }
      } catch (e) {
        // ignore
      }
    });

    // Navigate and wait for content
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for 6 seconds to bypass potential Cloudflare turnstile and let videos load
    await new Promise(r => setTimeout(r, 6000));

    // 2. Scrape Download Buttons from DOM
    async function extractPageLinks() {
      return await page.evaluate(() => {
        const links = [];
        // Only actual external file hosters go here
        const hosters = ['usersdrive', 'dood', 'vidmoly', 'filemoon', 'upstream', 'uqload', 'stream', 'drive', 'mega', 'uptobox', 't7meel', 'smoothpre'];
        const currentHost = window.location.hostname;
        
        document.querySelectorAll('a').forEach(a => {
          const text = a.innerText.toLowerCase().replace(/\s+/g, ' ').trim();
          const href = a.href.toLowerCase();
          
          if (!href || !href.startsWith('http')) return;
          
          // Exclude any link with text longer than 30 characters (definitely not a button)
          if (text.length > 30) return;
          
          // Exclude common navigation keywords in URLs to filter out garbage
          const badUrlKeywords = ['tag', 'category', 'genre', 'year', 'all-movies', 'faq', 'contact', 'dmca', 'login', 'register', 'promo', 'top_views', 'recent'];
          if (badUrlKeywords.some(k => href.includes(k))) return;
          
          // Exclude internal movie navigation links from sidebars
          if (href.includes(currentHost) && (href.includes('/movies/') || href.includes('/series/') || href.includes('/episode/'))) {
              // Only allow if it explicitly contains 'download' in the URL (not just text)
              if (!href.includes('download')) return;
          }
          
          // 1. Is it a known external file hoster?
          const isHosterLink = hosters.some(h => href.includes(h));
          // 2. Does the TEXT say download or a quality?
          const isDownloadText = text.includes('تحميل') || text.includes('download') || text.includes('سيرفر') || text.match(/(1080|720|480|360|240)(p)?/i) || text.includes('sd') || text.includes('hd');
          
          // If it matches ANY of our valid criteria
          if (isHosterLink || (isDownloadText && !href.includes(currentHost))) {
             // Avoid social media sharing links
             if (!href.includes('facebook.com') && !href.includes('twitter.com') && !href.includes('telegram.me') && !href.includes('google.com/store')) {
                 links.push({ url: a.href, text: a.innerText.trim() });
             }
          }
        });
        
        const ogImage = document.querySelector('meta[property="og:image"]');
        const title = document.title;
        
        return { links, title, thumbnail: ogImage ? ogImage.content : null };
      });
    }

    let extractData = await extractPageLinks();

    // Auto-follow to actual download page if we are on the main page
    const downloadPageLink = extractData.links.find(l => (l.url.includes('/download') || l.url.includes('download.php')) && !url.includes('/download'));
    if (downloadPageLink) {
      await page.goto(downloadPageLink.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 4000));
      
      const newExtract = await extractPageLinks();
      extractData.links = newExtract.links; // replace links with the actual quality buttons
    }

    await browser.close();

    const formats = [];
    
    // Add network sniffed URLs
    Array.from(mediaUrls).forEach((mUrl, i) => {
      // Exclude small assets/ads if possible, just blindly add for now
      if (!mUrl.includes('google') && !mUrl.includes('facebook')) {
        formats.push({
          label: mUrl.includes('.m3u8') ? `مباشر (Stream) ${i+1}` : `مباشر (MP4) ${i+1}`,
          url: mUrl,
          type: 'video',
          size: null,
          quality: 'Direct'
        });
      }
    });

    // Add explicit download links (filtering out obvious non-media links)
    const addedLinks = new Set();
    extractData.links.forEach(link => {
      if (!addedLinks.has(link.url)) {
        let finalUrl = link.url;


        formats.push({
          label: link.text || 'رابط تحميل',
          url: finalUrl,
          type: 'link', // Changed so frontend opens it directly
          size: null,
          quality: 'Link'
        });
        addedLinks.add(link.url);
      }
    });

    if (formats.length === 0) {
      throw new Error("لم نتمكن من العثور على روابط تحميل في هذه الصفحة. قد تكون محمية بقوة.");
    }

    return {
      title: extractData.title || "فيلم / مسلسل",
      author: "Movie Site",
      duration: null,
      views: null,
      thumbnail: extractData.thumbnail,
      sourceUrl: url,
      platform: { id: "moviesite", name: "Movie Site" },
      formats,
    };
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}
