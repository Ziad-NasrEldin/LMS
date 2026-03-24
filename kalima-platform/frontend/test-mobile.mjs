
import { chromium, devices } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 12'],
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:5173/signup');
  await page.waitForTimeout(3000);
  
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  const vWidth = await page.evaluate(() => window.innerWidth);
  console.log('ScrollWidth:', width, 'ViewportWidth:', vWidth);
  
  await browser.close();
})();

