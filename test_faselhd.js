import { scrapeMovieSite } from './src/app/api/analyze/puppeteer_engine.js';

async function test() {
  console.log("Testing FaselHD...");
  try {
    const result = await scrapeMovieSite('https://web6112x.faselhdx.bid/movies/%d9%81%d9%8a%d9%84%d9%85-gale-yellow-brick-road-2026-%d9%85%d8%aa%d8%b1%d8%ac%d9%85');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
