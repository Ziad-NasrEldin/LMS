
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5175/signup');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-desktop.png', fullPage: true });

  await browser.close();
})();

