import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

async function bypass() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // block ads aggressively
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType()) || req.url().includes('pop')) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const url = 'https://usersdrive.com/lsc66l1xke36.html';
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  try {
    console.log("Checking for Free Download button...");
    await page.evaluate(() => {
       const form = document.querySelector('form[name="F1"]');
       if(form) {
           form.method_free.value = "Free Download";
           form.submit();
       }
    });
    
    console.log("Wait for navigation...");
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(()=>console.log("Nav timeout"));
    
    console.log("Waiting 16 seconds for countdown...");
    await new Promise(r => setTimeout(r, 16000));
    
    console.log("Submitting final form...");
    await page.evaluate(() => {
        const form = document.querySelector('form[name="F1"]');
        if(form && form.down_direct) {
            form.down_direct.value = "1";
            form.submit();
        } else if(form) {
            form.submit();
        }
    });
    
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(()=>console.log("Nav 2 timeout"));
    
    const finalLink = await page.evaluate(() => {
        const a = document.querySelector('.down-link, a[href*=".mp4"]');
        return a ? a.href : null;
    });
    
    console.log("Final Direct Link:", finalLink);

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

bypass().catch(console.error);
