import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set viewport to a typical desktop size
    await page.setViewport({ width: 1280, height: 1024 });

    const htmlPath = path.resolve(__dirname, '../dist/design2.html');
    console.log('Loading page:', htmlPath);

    // Navigate to the local file
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

    // Ensure public/images/sections directory exists
    const outputDir = path.resolve(__dirname, '../public/images/sections');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const sectionsToCapture = [
        { id: 'hero', name: 'Homepage: Hero Section' },
        { id: 'about', name: 'Company: About Section' },
        { id: 'chemistry', name: 'Technology: Chemistry Section' },
        { id: 'products', name: 'Products: Overview Section' },
        { id: 'leadership', name: 'Company: Leadership Section' },
        { id: 'ip', name: 'Company: Intellectual Property Section' },
        { id: 'data', name: 'Technology: Data & Testing Section' },
        { id: 'contact', name: 'Contact Section' }
    ];

    const contentJsonPath = path.resolve(__dirname, '../public/content.json');
    let contentData = [];
    if (fs.existsSync(contentJsonPath)) {
        contentData = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));
    }

    let addedItems = 0;

    for (const section of sectionsToCapture) {
        console.log(`Processing section: #${section.id}`);
        const element = await page.$(`#${section.id}`);
        if (element) {
            const fileName = `section-${section.id}.jpg`;
            const outputPath = path.join(outputDir, fileName);

            await element.screenshot({ path: outputPath, type: 'jpeg', quality: 80 });
            console.log(`Saved screenshot to ${outputPath}`);

            // Check if it's already in content.json
            const existingItem = contentData.find(item => item.id === `design2-section-${section.id}`);
            if (!existingItem) {
                contentData.push({
                    id: `design2-section-${section.id}`,
                    title: section.name,
                    category: 'Design Mockup Reviews',
                    media: `images/sections/${fileName}`
                });
                addedItems++;
            }
        } else {
            console.warn(`Warning: Section #${section.id} not found.`);
        }
    }

    // Also capture some specific blocks if needed, like the "features" block
    // Just capturing main sections is probably enough based on user request.

    if (addedItems > 0) {
        fs.writeFileSync(contentJsonPath, JSON.stringify(contentData, null, 2));
        console.log(`Added ${addedItems} new items to content.json`);
    } else {
        console.log('No new items added to content.json');
    }

    await browser.close();
}

run().catch(console.error);
