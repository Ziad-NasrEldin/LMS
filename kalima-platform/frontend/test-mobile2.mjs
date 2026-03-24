
import { chromium, devices } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 12'],
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173/signup');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-signup.png', fullPage: true });

  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-login.png', fullPage: true });
  
  await browser.close();
})();

