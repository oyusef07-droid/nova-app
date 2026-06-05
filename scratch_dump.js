import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
puppeteer.use(StealthPlugin());

async function dumpJS() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://m.reviewrate.net/embed-lc2ftuq6chmr.html', { waitUntil: 'domcontentloaded' });
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script')).map(s => s.innerHTML).filter(s => s.trim().length > 0);
  });
  
  fs.writeFileSync('reviewrate_scripts.txt', scripts.join('\n\n---NEXT SCRIPT---\n\n'));
  console.log("Dumped scripts to reviewrate_scripts.txt");
  await browser.close();
}

dumpJS().catch(console.error);
