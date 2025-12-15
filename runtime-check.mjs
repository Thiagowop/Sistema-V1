import { chromium } from 'playwright';

const targetUrl = process.env.RUNTIME_CHECK_URL || 'http://localhost:3017';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[browser:${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`[pageerror] ${error.message}`);
    if (error.stack) {
      console.log(error.stack);
    }
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('[runtime-check] page title:', await page.title());
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    console.log('[runtime-check] body text length:', bodyText.length);
    await page.screenshot({ path: 'runtime-check.png', fullPage: true });
    console.log('[runtime-check] screenshot saved to runtime-check.png');
  } catch (error) {
    console.log('[runtime-check] navigation failed:', error.message);
  } finally {
    await browser.close();
  }
})();
