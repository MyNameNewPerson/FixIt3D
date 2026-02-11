import { chromium } from 'playwright';
import path from 'path';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Set viewport to a common desktop size
    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

        // 1. Home Page
        console.log('Capturing home page...');
        await page.screenshot({ path: 'verification/home.png', fullPage: true });

        // 2. Switch to Hobby Mode
        console.log('Switching to Hobby mode...');
        const hobbyBtn = await page.locator('button[data-mode="hobby"]');
        if (await hobbyBtn.isVisible()) {
            await hobbyBtn.click();
            // Wait for results to load (checking for a card)
            await page.waitForSelector('.model-card', { timeout: 10000 });
            await page.waitForTimeout(1000); // Wait for transition
            await page.screenshot({ path: 'verification/hobby_mode.png', fullPage: true });
        } else {
            console.error('Hobby mode button not found');
        }

        // 3. Open Model Detail (Modal)
        console.log('Opening model detail modal...');
        const firstCard = await page.locator('.model-card').first();
        if (await firstCard.isVisible()) {
            await firstCard.click();
            await page.waitForSelector('#model-modal', { state: 'visible', timeout: 5000 });
            // Wait for potential content loading in modal (images, etc)
            await page.waitForTimeout(1000);

            await page.screenshot({ path: 'verification/model_detail.png' });

            // 4. Test Calculator in Modal
            console.log('Testing calculator...');
            const calcBtn = await page.locator('.btn-calc');
            if (await calcBtn.isVisible()) {
                await calcBtn.click();
                await page.waitForSelector('#calc-result', { timeout: 5000 });
                await page.waitForTimeout(500);
                await page.screenshot({ path: 'verification/calculator_active.png' });
            }

            // Close modal
            await page.click('.close-modal');
        } else {
            console.error('No model cards found to click');
        }

        // 5. Test Map (Find Master)
        console.log('Testing Map...');
        const findMasterBtn = await page.locator('.btn-secondary[data-mode-switch]'); // Hero button
        // Wait, I should find by text or selector
        const mapBtn = await page.locator('button:has-text("Найти мастера"), button:has-text("Find Master")');
        if (await mapBtn.isVisible()) {
            await mapBtn.click();
            const mapSection = await page.locator('#map-section');
            await mapSection.scrollIntoViewIfNeeded();
            await page.waitForTimeout(2000); // Wait for tiles to load
            await page.screenshot({ path: 'verification/map_section.png' });
        }

    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        await browser.close();
    }
})();
