const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // Assume app is running on localhost:5173
  await page.goto('http://localhost:5173/owner/properties/new');
  
  // Need to log in or handle auth?
  // Actually, we can just run the test locally or visually.
  await browser.close();
})();
