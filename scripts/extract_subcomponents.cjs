const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// ── Load source HTML ────────────────────────────────────────────────────────
const htmlPath = path.join(__dirname, '../dist/design2.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(htmlContent);

const outputDir = path.join(__dirname, '../public/sections');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ── Extract shared styles from <head> ───────────────────────────────────────
// Includes embedded fonts, CSS custom properties, FA icons, and all section styles
const styleTags = $('head style').map((i, el) => $.html(el)).get().join('\n');
const linkTags = $('head link[rel="stylesheet"], head link[type="text/css"]')
  .map((i, el) => $.html(el))
  .get()
  .join('\n');

// CSS overrides so elements are visible in static iframe (no scroll-triggered animations)
const animationOverrides = `
<style>
/* Neutralize scroll-triggered animations so elements are visible immediately */
.animate-in, .reveal, .fade-up, .fade-in,
[class*="animate-"], [class*="reveal"] {
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
  animation: none !important;
  transition: none !important;
}
/* Let sub-component fill the iframe naturally */
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}
/* Strip large section min-heights/paddings so isolated fragments fit tightly */
section, .hero, .chemistry, .about, .products, .leadership, .ip, .data, .contact {
  min-height: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>
`;

// ── Helper: wrap a fragment in a full HTML document ─────────────────────────
function wrapAndSave(fragmentHtml, fileName, { bodyClass = '', bodyStyle = '', sectionClass = '', maxWidth = '' } = {}) {
  const classAttr = bodyClass ? ` class="${bodyClass}"` : '';
  const styleAttr = bodyStyle ? ` style="${bodyStyle}"` : '';
  // Constrain card-type components to their natural width from the design
  const mwStyle = maxWidth ? `max-width:${maxWidth}; margin:0 auto;` : '';
  // Wrap in a parent section element so CSS selectors like `.chemistry .section-heading` match
  const inner = sectionClass
    ? `<div class="${sectionClass}" style="padding:0;${mwStyle}">${fragmentHtml}</div>`
    : (mwStyle ? `<div style="${mwStyle}">${fragmentHtml}</div>` : fragmentHtml);
  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sub-component</title>
  ${linkTags}
  ${styleTags}
  ${animationOverrides}
</head>
<body${classAttr}${styleAttr}>
  ${inner}
</body>
</html>`;

  const outPath = path.join(outputDir, fileName);
  fs.writeFileSync(outPath, doc);
  console.log(`  ✓ ${fileName}`);
  return `sections/${fileName}`;
}

// ── 28 Component Mappings ───────────────────────────────────────────────────
// Each entry: { name, extract($) → html string, options }

// Match the original design's section backgrounds
// sectionClass wraps the fragment so CSS descendant selectors (e.g. `.chemistry .section-heading`) still match
const heroBg = {
  bodyStyle: 'background: #0A1628; color: #FFFFFF; padding: 40px 20px;',
  sectionClass: 'hero',
};

const chemBg = {
  bodyStyle: 'background: #0A1628; color: #FFFFFF; padding: 40px 20px;',
  sectionClass: 'chemistry',
};

const ipBg = {
  bodyStyle: 'background: #0A1628; color: #FFFFFF; padding: 40px 20px;',
  sectionClass: 'ip',
};

const dataBg = {
  bodyStyle: 'background: #0A1628; color: #FFFFFF; padding: 40px 20px;',
  sectionClass: 'data',
};

const creamBg = {
  bodyStyle: 'background: #F4F1EC; padding: 40px 20px;',
};

const whiteBg = {
  bodyStyle: 'background: #FFFFFF; padding: 40px 20px;',
};

const componentMappings = [
  // ── Hero (4) — navy background ─────────────────────────────────────────────
  {
    name: 'hero-headline',
    extract: ($) => {
      const eyebrow = $.html($('.hero__eyebrow'));
      const title = $.html($('.hero__title'));
      const subtitle = $.html($('.hero__subtitle'));
      return `<div class="hero__content">${eyebrow}${title}${subtitle}</div>`;
    },
    options: heroBg,
  },
  {
    name: 'hero-cta',
    extract: ($) => $.html($('.hero__actions')),
    options: { ...heroBg, bodyStyle: 'background: #0A1628; color: #FFFFFF; padding: 20px;' },
  },
  {
    name: 'hero-stats',
    extract: ($) => $.html($('.hero__credibility')),
    options: heroBg,
  },
  {
    name: 'hero-visual',
    extract: ($) => {
      const bg = $.html($('.hero__bg'));
      const gradient = $.html($('.hero__gradient'));
      const diamond = $.html($('.hero__diamond'));
      return `<section class="hero" style="position:relative; min-height:500px; overflow:hidden;">${bg}${gradient}${diamond}</section>`;
    },
    options: { bodyStyle: 'margin:0; padding:0;' },
  },

  // ── About (2) — cream background ─────────────────────────────────────────
  {
    name: 'about-copy',
    extract: ($) => $.html($('.about__text')),
    options: creamBg,
  },
  {
    name: 'about-image',
    extract: ($) => $.html($('.about__image')),
    options: creamBg,
  },

  // ── Chemistry (6) — navy background ───────────────────────────────────────
  {
    name: 'chemistry-heading',
    extract: ($) => {
      const container = $('#chemistry > .container');
      const label = $.html(container.children('.section-label'));
      const h2 = $.html(container.children('.section-heading'));
      const sub = $.html(container.children('.section-subhead'));
      return `<div class="container">${label}${h2}${sub}</div>`;
    },
    options: chemBg,
  },
  {
    name: 'chemistry-stage-1',
    extract: ($) => $.html($('.chemistry__pillars article.pillar').eq(0)),
    options: { ...chemBg, maxWidth: '600px' },
  },
  {
    name: 'chemistry-stage-2',
    extract: ($) => $.html($('.chemistry__pillars article.pillar').eq(1)),
    options: { ...chemBg, maxWidth: '600px' },
  },
  {
    name: 'chemistry-stage-3',
    extract: ($) => $.html($('.chemistry__pillars article.pillar').eq(2)),
    options: { ...chemBg, maxWidth: '600px' },
  },
  {
    name: 'chemistry-stage-4',
    extract: ($) => $.html($('.chemistry__pillars article.pillar').eq(3)),
    options: { ...chemBg, maxWidth: '600px' },
  },
  {
    name: 'chemistry-video',
    extract: ($) => $.html($('.chemistry__video')),
    options: chemBg,
  },

  // ── Products (6) — cream background ───────────────────────────────────────
  {
    name: 'products-heading',
    extract: ($) => {
      const container = $('#products > .container');
      const label = $.html(container.children('.section-label'));
      const h2 = $.html(container.children('.section-heading'));
      const sub = $.html(container.children('.section-subhead'));
      return `<div class="container">${label}${h2}${sub}</div>`;
    },
    options: creamBg,
  },
  {
    name: 'products-paper',
    extract: ($) => {
      const card = $('.product-card').filter((i, el) => $(el).find('h3').text().includes('Solution, Paper'));
      return $.html(card);
    },
    options: { ...creamBg, maxWidth: '600px' },
  },
  {
    name: 'products-pallet',
    extract: ($) => {
      const card = $('.product-card').filter((i, el) => $(el).find('h3').text().includes('Pallet'));
      return $.html(card);
    },
    options: { ...creamBg, maxWidth: '600px' },
  },
  {
    name: 'products-cork',
    extract: ($) => {
      const card = $('.product-card').filter((i, el) => $(el).find('h3').text().includes('Cork'));
      return $.html(card);
    },
    options: { ...creamBg, maxWidth: '600px' },
  },
  {
    name: 'products-flowerpot',
    extract: ($) => {
      const card = $('.product-card').filter((i, el) => $(el).find('h3').text().includes('Flowerpot'));
      return $.html(card);
    },
    options: { ...creamBg, maxWidth: '600px' },
  },
  {
    name: 'products-agriculture',
    extract: ($) => {
      const card = $('.product-card').filter((i, el) => $(el).find('h3').text().includes('Agricultural'));
      return $.html(card);
    },
    options: { ...creamBg, maxWidth: '600px' },
  },

  // ── Leadership (4) — white background ─────────────────────────────────────
  {
    name: 'leadership-heading',
    extract: ($) => {
      const container = $('#leadership > .container');
      const label = $.html(container.children('.section-label'));
      const h2 = $.html(container.children('.section-heading'));
      return `<div class="container">${label}${h2}</div>`;
    },
    options: whiteBg,
  },
  {
    name: 'leadership-rich',
    extract: ($) => {
      const card = $('.leader').filter((i, el) => $(el).text().includes('Rich'));
      return $.html(card);
    },
    options: { ...whiteBg, maxWidth: '400px' },
  },
  {
    name: 'leadership-bob',
    extract: ($) => {
      const card = $('.leader').filter((i, el) => $(el).text().includes('Bob'));
      return $.html(card);
    },
    options: { ...whiteBg, maxWidth: '400px' },
  },
  {
    name: 'leadership-fred',
    extract: ($) => {
      const card = $('.leader').filter((i, el) => $(el).text().includes('Fred'));
      return $.html(card);
    },
    options: { ...whiteBg, maxWidth: '400px' },
  },

  // ── IP (4) — navy background ──────────────────────────────────────────────
  {
    name: 'ip-heading',
    extract: ($) => {
      const container = $('#ip > .container');
      const label = $.html(container.children('.section-label'));
      const h2 = $.html(container.children('.section-heading'));
      const badge = $.html(container.children('.ip__badge'));
      const banner = $.html(container.children('.ip__patent-banner'));
      return `<div class="container">${label}${h2}${badge}${banner}</div>`;
    },
    options: ipBg,
  },
  {
    name: 'ip-prior-art',
    extract: ($) => $.html($('.ip__narrative-col--prior')),
    options: { ...ipBg, maxWidth: '600px' },
  },
  {
    name: 'ip-solution',
    extract: ($) => $.html($('.ip__narrative-col--solution')),
    options: { ...ipBg, maxWidth: '600px' },
  },
  {
    name: 'ip-comparison-shelf-life',
    extract: ($) => $.html($('.ip__comparison').eq(0)),
    options: { ...ipBg, maxWidth: '600px' },
  },
  {
    name: 'ip-comparison-processing-temp',
    extract: ($) => $.html($('.ip__comparison').eq(1)),
    options: { ...ipBg, maxWidth: '600px' },
  },
  {
    name: 'ip-comparison-volume',
    extract: ($) => $.html($('.ip__comparison').eq(2)),
    options: { ...ipBg, maxWidth: '600px' },
  },
  {
    name: 'ip-comparison-oligomer',
    extract: ($) => $.html($('.ip__comparison').eq(3)),
    options: { ...ipBg, maxWidth: '600px' },
  },

  // ── Data (7) — navy background ────────────────────────────────────────────
  {
    name: 'data-heading',
    extract: ($) => {
      const container = $('#data > .container');
      const label = $.html(container.children('.section-label'));
      const h2 = $.html(container.children('.section-heading'));
      const sub = $.html(container.children('.section-subhead'));
      const disc = $.html(container.children('.data__disclaimer'));
      return `<div class="container">${label}${h2}${sub}${disc}</div>`;
    },
    options: dataBg,
  },
  {
    name: 'data-tile-tensile',
    extract: ($) => $.html($('.data-tile').eq(0)),
    options: { ...dataBg, maxWidth: '420px' },
  },
  {
    name: 'data-tile-contact-angle',
    extract: ($) => $.html($('.data-tile').eq(1)),
    options: { ...dataBg, maxWidth: '420px' },
  },
  {
    name: 'data-tile-repulpability',
    extract: ($) => $.html($('.data-tile').eq(2)),
    options: { ...dataBg, maxWidth: '420px' },
  },
  {
    name: 'data-tile-recyclability',
    extract: ($) => $.html($('.data-tile').eq(3)),
    options: { ...dataBg, maxWidth: '420px' },
  },
  {
    name: 'data-tile-food-safe',
    extract: ($) => $.html($('.data-tile').eq(4)),
    options: { ...dataBg, maxWidth: '420px' },
  },
  {
    name: 'data-tile-acoustic',
    extract: ($) => $.html($('.data-tile').eq(5)),
    options: { ...dataBg, maxWidth: '420px' },
  },

  // ── Contact (3) — cream background ────────────────────────────────────────
  {
    name: 'contact-heading',
    extract: ($) => {
      const container = $('#contact > .container');
      const label = $.html(container.children('.section-label'));
      const h2 = $.html(container.children('.section-heading'));
      const sub = $.html(container.children('.section-subhead'));
      return `<div class="container">${label}${h2}${sub}</div>`;
    },
    options: creamBg,
  },
  {
    name: 'contact-info',
    extract: ($) => $.html($('.contact__info')),
    options: creamBg,
  },
  {
    name: 'contact-form',
    extract: ($) => $.html($('.contact__form')),
    options: creamBg,
  },
];

// ── Run extraction ──────────────────────────────────────────────────────────
console.log(`Extracting ${componentMappings.length} sub-components from design2.html...\n`);

let successCount = 0;

for (const mapping of componentMappings) {
  const fragmentHtml = mapping.extract($);
  if (!fragmentHtml || fragmentHtml.trim() === '') {
    console.warn(`  ✗ ${mapping.name} — selector returned empty HTML`);
    continue;
  }
  const fileName = `component-${mapping.name}.html`;
  wrapAndSave(fragmentHtml, fileName, mapping.options || {});
  successCount++;
}

console.log(`\nDone: ${successCount}/${componentMappings.length} sub-components extracted.`);
