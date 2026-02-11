const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.model-card');

    // Screenshot of home
    await page.screenshot({ path: '/home/jules/verification/mobile_home_v3.png' });
    console.log('Mobile home screenshot saved');

    // Click a model card
    await page.click('.model-card');
    await page.waitForSelector('.modal-card-detail', { state: 'visible' });

    // Wait for map or viewer to potentially load
    await page.waitForTimeout(2000);

    // Screenshot of modal
    await page.screenshot({ path: '/home/jules/verification/mobile_modal_v3.png' });
    console.log('Mobile modal screenshot saved');

    // Close modal
    await page.click('.close-modal-btn');
    await page.waitForSelector('.modal-card-detail', { state: 'hidden' });

    // Change language
    await page.click('[data-lang="en"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/jules/verification/mobile_en_v3.png' });
    console.log('Mobile EN screenshot saved');

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await browser.close();
  }
})();
