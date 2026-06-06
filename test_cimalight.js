import { scrapeMovieSite } from './src/app/api/analyze/puppeteer_engine.js';

async function test() {
  console.log("Testing Cimalight...");
  try {
    const result = await scrapeMovieSite('https://r.cimalight.co/watch.php?vid=d48284d90');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
