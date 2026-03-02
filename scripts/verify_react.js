import puppeteer from 'puppeteer';

async function verify() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });

    console.log('Navigating to local React app...');
    await page.goto('http://localhost:5174/BEST/#/r/review-1', { waitUntil: 'networkidle0' });

    // Scroll to bottom to load all items including our new HTML items
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait a bit for images/iframes to load
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: '/Users/miketunis/.gemini/antigravity/brain/13af8152-16d0-4dcc-9daa-03ebe0f5bdc0/html_rendering_verification.webp', type: 'webp' });
    console.log('Saved verification screenshot');

    await browser.close();
}

verify().catch(console.error);
