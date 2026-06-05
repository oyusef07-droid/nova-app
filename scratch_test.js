import { scrapeMovieSite } from './src/app/api/analyze/puppeteer_engine.js';
(async () => {
  try {
    console.log("Scraping...");
    const res = await scrapeMovieSite("https://m.asd.ink/فيلم-المشروع-اكس-2025/");
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
