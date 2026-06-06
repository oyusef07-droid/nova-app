import { scrapeMovieSite } from './src/app/api/analyze/puppeteer_engine.js';

async function test() {
  console.log("Testing Akwam...");
  try {
    const result = await scrapeMovieSite('https://akwams.org/%d9%85%d8%b4%d8%a7%d9%87%d8%af%d8%a9-%d9%81%d9%8a%d9%84%d9%85-fuze-2025-%d9%85%d8%aa%d8%b1%d8%ac%d9%85/');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
