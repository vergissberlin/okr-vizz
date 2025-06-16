const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false
  });
  
  try {
    const page = await browser.newPage();
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');
    
    console.log('Waiting for content to load...');
    const content = await page.content();
    console.log('Page content:', content);
    
    console.log('Waiting for h1 element...');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    const title = await page.title();
    console.log('Page title:', title);
    
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot saved as test-screenshot.png');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})(); 