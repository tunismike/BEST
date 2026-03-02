import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const htmlPath = path.resolve(__dirname, '../dist/design2.html');
  console.log('Loading page:', htmlPath);

  const rawHtml = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(rawHtml);

  // Extract styles and fonts from the <head>
  const styleTags = $('head style').map((i, el) => $.html(el)).get().join('\n');
  const linkTags = $('head link[rel="stylesheet"], head link[type="text/css"]').map((i, el) => {
    // If the stylesheet is local, we need to make sure the iframe can resolve it 
    // For this simple case we'll assume it will resolve from public directory, but typically fonts are inline or absolute.
    return $.html(el);
  }).get().join('\n');

  const globalCss = `
    <style>
      /* Ensure the extracted section fills its iframe */
      body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow-x: hidden;
      }
      
      /* Override animations to ensure content is visible statically */
      .animate-in, .reveal {
        opacity: 1 !important;
        transform: translateY(0) !important;
        animation: none !important;
        transition: none !important;
      }
    </style>
  `;

  const headContent = `
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${linkTags}
      ${styleTags}
      ${globalCss}
    </head>
  `;

  // Ensure public/sections directory exists
  const outputDir = path.resolve(__dirname, '../public/sections');
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

  let processedItems = 0;

  for (const section of sectionsToCapture) {
    console.log(`Processing section: #${section.id}`);
    const elementHtml = $(`#${section.id}`).prop('outerHTML');

    if (elementHtml) {
      const fileName = `section-${section.id}.html`;
      const outputPath = path.join(outputDir, fileName);

      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
${headContent}
<body>
  ${elementHtml}
</body>
</html>
      `;

      fs.writeFileSync(outputPath, fullHtml.trim());
      console.log(`Saved HTML to ${outputPath}`);

      // Update content.json to point to the HTML instead of the JPG
      const jsonId = `design2-section-${section.id}`;
      const existingIndex = contentData.findIndex(item => item.id === jsonId);

      const newItem = {
        id: jsonId,
        title: section.name,
        category: 'Design Mockup Reviews',
        htmlFile: `sections/${fileName}`  // NEW PROPERTY
      };

      if (existingIndex >= 0) {
        // Remove 'media' if it exists and replace with the updated item
        delete contentData[existingIndex].media;
        contentData[existingIndex] = { ...contentData[existingIndex], ...newItem };
      } else {
        contentData.push(newItem);
      }
      processedItems++;
    } else {
      console.warn(`Warning: Section #${section.id} not found.`);
    }
  }

  if (processedItems > 0) {
    fs.writeFileSync(contentJsonPath, JSON.stringify(contentData, null, 2));
    console.log(`Updated ${processedItems} items in content.json`);
  }
}

run().catch(console.error);
/* End of file */
