import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

async function dump() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://akwams.org/%d9%85%d8%b4%d8%a7%d9%87%d8%af%d8%a9-%d9%81%d9%8a%d9%84%d9%85-fuze-2025-%d9%85%d8%aa%d8%b1%d8%ac%d9%85/', { waitUntil: 'domcontentloaded' });
  
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText.trim(),
        href: a.href,
        className: a.className
    })).filter(l => l.href && (l.href.includes('download') || l.text.includes('1080') || l.text.includes('720') || l.text.includes('تحميل')));
  });
  
  console.log(JSON.stringify(links, null, 2));
  await browser.close();
}

dump().catch(console.error);
