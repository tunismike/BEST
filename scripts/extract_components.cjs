const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const htmlPath = path.join(__dirname, '../dist/design2.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(htmlContent);

const outputDir = path.join(__dirname, '../public/sections');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const contentJsonPath = path.join(__dirname, '../public/content.json');
let contentData = [];
if (fs.existsSync(contentJsonPath)) {
    contentData = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));
}

// Global CSS overrides to make animations visible immediately
const globalCss = `
<style>
/* Neutralize animations so elements are visible in iframe */
.animate-in, .reveal, .fade-up, .fade-in, [class*="animate-"], [class*="reveal"] {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    animation: none !important;
    transition: none !important;
}
body { background-color: var(--color-background, #f5f5f5); padding: 20px; } /* Add padding for isolated view */
/* Strip container constraints if we just want the widget */
.container { max-width: 100% !important; padding: 0 !important; }
</style>
`;

// Extract required CSS
let styles = '';
$('link[rel="stylesheet"]').each((i, el) => {
    styles += $.html(el) + '\n';
});
styles += globalCss;

function extractAndSaveHtml(elementHtml, fileName) {
    const wrappedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mockup</title>
    ${styles}
</head>
<body class="light-mode">
    ${elementHtml}
</body>
</html>`;

    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, wrappedHtml);
    return `sections/${fileName}`;
}

// Define the mapping
const componentMappings = [
    {
        id: 'product-paper-image',
        selector: '.product-card:contains("The BEST Solution")',
    },
    {
        id: 'product-flowerpot-image',
        selector: '.product-card:contains("Flowerpot")',
    },
    {
        id: 'product-stakes-image',
        selector: '.product-card:contains("Garden Stakes")',
    },
    {
        id: 'product-weedblock-image',
        selector: '.product-card:contains("Weed Block")',
    },
    {
        id: 'product-treeskirt-image',
        selector: '.product-card:contains("Tree Skirt")',
    },
    {
        id: 'product-cork-image',
        selector: '.product-card:contains("Cork")',
    },
    // Team Members
    {
        id: 'about-lacour-bio',
        selector: '.leader:contains("Rich")',
    },
    {
        id: 'about-morton-bio',
        selector: '.leader:contains("Bob")',
    },
    {
        id: 'about-lowder-bio',
        selector: '.leader:contains("Fred")',
    }
];

let updatedCount = 0;

for (const mapping of componentMappings) {
    const el = $(mapping.selector).first();
    if (el.length > 0) {
        // Strip out onclick attributes to prevent errors in iframe
        el.removeAttr('onclick');

        const html = $.html(el);
        const fileName = `component-${mapping.id}.html`;
        const relPath = extractAndSaveHtml(html, fileName);

        const itemIndex = contentData.findIndex(item => item.id === mapping.id);
        if (itemIndex !== -1) {
            contentData[itemIndex].htmlFile = relPath;
            // Optionally, we could remove 'media' or 'description' here so it only shows HTML,
            // but FocusMode and ContentCard now prioritize htmlFile if present.
            // Let's remove media so we don't accidentally render both or cause confusion.
            delete contentData[itemIndex].media;
            // delete contentData[itemIndex].description; // keep description for context if needed
            updatedCount++;
            console.log(`Updated content.json item: ${mapping.id} with ${relPath}`);
        }
    } else {
        console.warn(`Selector not found for ${mapping.id}: ${mapping.selector}`);
    }
}

// REMOVE the monolithic section items we added earlier
const idsToRemove = [
    'design2-section-hero',
    'design2-section-about',
    'design2-section-chemistry',
    'design2-section-products',
    'design2-section-leadership',
    'design2-section-ip',
    'design2-section-data',
    'design2-section-contact'
];

const originalLength = contentData.length;
contentData = contentData.filter(item => !idsToRemove.includes(item.id));
const removedCount = originalLength - contentData.length;

if (updatedCount > 0 || removedCount > 0) {
    fs.writeFileSync(contentJsonPath, JSON.stringify(contentData, null, 2));
    console.log(`Updated ${updatedCount} items and removed ${removedCount} monolithic sections in content.json`);
} else {
    console.log('No changes made to content.json');
}

console.log('Done mapping specific components.');
