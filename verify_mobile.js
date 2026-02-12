import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    // iPhone 13 Pro Max viewport
    const context = await browser.newContext({
        viewport: { width: 428, height: 926 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to http://localhost:3000 (Mobile)...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

        // 1. Home Page Mobile
        console.log('Capturing home page (Mobile)...');
        await page.screenshot({ path: 'verification/mobile_home.png' });

        // 2. Open Model Detail (Modal) Mobile
        console.log('Opening model detail modal (Mobile)...');
        const firstCard = await page.locator('.model-card').first();
        if (await firstCard.isVisible()) {
            await firstCard.click();
            await page.waitForSelector('#model-modal', { state: 'visible', timeout: 5000 });
            await page.waitForTimeout(1000);

            // Screenshot of modal top
            await page.screenshot({ path: 'verification/mobile_modal_top.png' });

            // Scroll down in modal info column
            console.log('Scrolling in modal info column...');
            await page.evaluate(() => {
                const infoCol = document.querySelector('.modal-info-column');
                if (infoCol) infoCol.scrollTop = 500;
            });
            await page.waitForTimeout(500);
            await page.screenshot({ path: 'verification/mobile_modal_scrolled.png' });

            // Test calculator tab on mobile
            console.log('Testing calculator (Mobile)...');
            await page.click('.btn-calc');
            await page.waitForTimeout(500);
            await page.screenshot({ path: 'verification/mobile_calculator.png' });

        } else {
            console.error('No model cards found');
        }

    } catch (err) {
        console.error('Error during mobile verification:', err);
    } finally {
        await browser.close();
    }
})();
