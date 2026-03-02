const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to app...');
    await page.goto('http://localhost:5174/BEST/#/r/review-1', { waitUntil: 'networkidle0' });

    // Wait for login select
    await page.waitForSelector('select');
    await page.select('select', 'Mark@parrishpartners.com');

    // Click enter button
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const enterBtn = buttons.find(b => b.innerText.includes('Enter'));
        if (enterBtn) enterBtn.click();
    });

    // Wait for the app to load
    await page.waitForSelector('input[placeholder="Search..."]');
    await new Promise(r => setTimeout(r, 2000));

    // Type in the search box to find garden stakes
    const searchInput = await page.$('input[placeholder="Search..."]');
    if (searchInput) {
        await searchInput.type('Stakes');
        await new Promise(r => setTimeout(r, 2000)); // Wait for results to filter
    }

    // Take screenshot of Garden Stakes card
    const filePath = path.join(__dirname, '../debug_stakes.png');
    await page.screenshot({ path: filePath });
    console.log(`Saved screenshot to ${filePath}`);

    await browser.close();
})();
