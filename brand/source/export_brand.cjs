const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const dep = createRequire('/Users/alonsogcespedes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const sharp = dep('sharp');
const { chromium } = dep('playwright');
const root = path.resolve(__dirname, '../..');
(async () => {
  for (const file of fs.readdirSync(path.join(root, 'brand/svg'))) {
    if (!file.endsWith('.svg')) continue;
    const src = path.join(root, 'brand/svg', file);
    const dest = path.join(root, 'brand/png', file.replace('.svg', '.png'));
    await sharp(src, {density:216}).png().toFile(dest);
    if (file.includes('-app-')) {
      for (const size of [512,1024]) await sharp(src).resize(size,size).png().toFile(dest.replace('.png', `-${size}.png`));
    }
  }
  for (const size of [16,32]) await sharp(path.join(root,'brand/svg/faro-favicon.svg')).resize(size,size).png().toFile(path.join(root,`brand/png/faro-favicon-${size}.png`));
  await sharp(path.join(root,'brand/svg/faro-app-dark.svg')).resize(400,400).png().toFile(path.join(root,'brand/social/faro-avatar-400.png'));
  for (const file of fs.readdirSync(path.join(root,'brand/social'))) if (file.endsWith('.svg')) await sharp(path.join(root,'brand/social',file)).png().toFile(path.join(root,'brand/social',file.replace('.svg','.png')));
  fs.mkdirSync(path.join(root,'client/public/brand'), {recursive:true});
  fs.copyFileSync(path.join(root,'brand/svg/faro-horizontal-color.svg'), path.join(root,'client/public/brand/faro-horizontal.svg'));
  fs.copyFileSync(path.join(root,'brand/svg/faro-favicon.svg'), path.join(root,'client/public/brand/faro-favicon.svg'));
  for (const size of [180,192,512]) await sharp(path.join(root,'brand/svg/faro-app-dark.svg')).resize(size,size).png().toFile(path.join(root,`client/public/brand/faro-app-${size}.png`));
  const browser = await chromium.launch({headless:true, channel:"chrome"});
  const page = await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
  await page.goto('file://'+path.join(root,'brand/vista-general.html'));
  await page.screenshot({path:path.join(root,'brand/vista-general.png'),fullPage:true});
  await page.goto('file://'+path.join(root,'brand/guia-visual.html'));
  await page.pdf({path:path.join(root,'output/pdf/faro-guia-identidad.pdf'),width:'1120px',height:'792px',printBackground:true});
  // Flag visible text that spills out of its page or overlaps the footer.
  const overflow = await page.locator('.page').evaluateAll(pages => pages.flatMap((p,i) => [...p.querySelectorAll('p,h1,h2,h3,.quote,.card,.micro-line,.applications')].filter(e => e.getBoundingClientRect().bottom > p.getBoundingClientRect().bottom-48).map(e=>({page:i+1,tag:e.tagName,text:e.textContent.slice(0,70)}))));
  console.log(JSON.stringify({overflow}));
  await browser.close();
})();
