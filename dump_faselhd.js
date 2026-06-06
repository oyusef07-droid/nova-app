import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

async function dump() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://web6112x.faselhdx.bid/movies/%d9%81%d9%8a%d9%84%d9%85-gale-yellow-brick-road-2026-%d9%85%d8%aa%d8%b1%d8%ac%d9%85', { waitUntil: 'domcontentloaded' });
  
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText.trim(),
        href: a.href,
        className: a.className
    })).filter(l => l.text.includes('تحميل') || l.href.includes('download') || l.href.includes('t7meel') || l.className.includes('download'));
  });
  
  console.log(JSON.stringify(links, null, 2));
  await browser.close();
}

dump().catch(console.error);
