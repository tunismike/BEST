import puppeteer from 'puppeteer';

async function check() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });

    console.log('Navigating to section-hero.html...');
    await page.goto('http://localhost:5174/BEST/sections/section-hero.html', { waitUntil: 'networkidle0' });

    await page.screenshot({ path: '/Users/miketunis/.gemini/antigravity/brain/13af8152-16d0-4dcc-9daa-03ebe0f5bdc0/debug_iframe_hero.png', type: 'png' });

    console.log('Navigating to section-about.html...');
    await page.goto('http://localhost:5174/BEST/sections/section-about.html', { waitUntil: 'networkidle0' });

    await page.screenshot({ path: '/Users/miketunis/.gemini/antigravity/brain/13af8152-16d0-4dcc-9daa-03ebe0f5bdc0/debug_iframe_about.png', type: 'png' });

    await browser.close();
}

check().catch(console.error);
