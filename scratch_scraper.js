import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

async function testScraper() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-web-security'] });
  const page = await browser.newPage();
  
  try {
    const watchUrl = 'https://m.asd.ink/%d9%81%d9%8a%d9%84%d9%85-ratatouille-2007-%d8%a7%d9%84%d9%81%d8%a7%d8%b1-%d8%a7%d9%84%d8%b7%d8%a8%d8%a7%d8%ae-%d9%85%d8%af%d8%a8%d9%84%d8%ac/watch/';
    await page.goto(watchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Find iframe
    const iframeSrc = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      const embed = iframes.find(f => f.src.includes('play.php?url='));
      return embed ? embed.src : null;
    });
    
    if (iframeSrc) {
      const b64 = iframeSrc.split('url=')[1];
      const decodedSrc = Buffer.from(b64, 'base64').toString('utf8');
      console.log("Navigating to video player:", decodedSrc);
      
      const playerPage = await browser.newPage();
      
      // Request Interception for Adblocking
      await playerPage.setRequestInterception(true);
      playerPage.on('request', request => {
        const url = request.url().toLowerCase();
        if (url.includes('cdnfdcams') || url.includes('pop') || url.includes('ads') || url.includes('track') || url.includes('analytics') || url.includes('llvpn')) {
            request.abort();
        } else {
            request.continue();
        }
      });
      
      const mediaUrls = new Set();
      playerPage.on('response', response => {
        const resUrl = response.url();
        if (resUrl.includes('.mp4') || resUrl.includes('.m3u8')) {
           mediaUrls.add(resUrl);
        }
      });
      
      await playerPage.goto(decodedSrc, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      console.log("Clicking player multiple times with real mouse clicks...");
      for(let i=0; i<3; i++) {
        await playerPage.mouse.click(600, 300);
        await new Promise(r => setTimeout(r, 2000));
        
        const vSrc = await playerPage.evaluate(() => {
          const v = document.querySelector('video');
          return v ? v.src : null;
        });
        if (vSrc && vSrc.startsWith('http') && !vSrc.includes('blob')) {
            mediaUrls.add(vSrc);
        }
      }
      
      console.log("Final Media URLs:", Array.from(mediaUrls));
      await playerPage.close();
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

testScraper().catch(console.error);
