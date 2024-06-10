import puppeteer from 'puppeteer';

async function scrape(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Example of scraping page title
  const data = await page.evaluate(() => {
    return {
      title: document.title,
      // Add more scraping logic here
    };
  });

  await browser.close();
  return data;
}

scrape('https://example.com').then(console.log).catch(console.error);

