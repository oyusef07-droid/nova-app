import { scrapeMovieSite } from './src/app/api/analyze/puppeteer_engine.js';

async function test() {
  console.log("Testing EgBest...");
  try {
    const result = await scrapeMovieSite('https://egbest.cam/episode/mslsl-ant-mn-ahbbt-aljza-alawl-alhlqh-31-mdbljh');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
