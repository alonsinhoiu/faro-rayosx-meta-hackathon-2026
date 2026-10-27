const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const dep = createRequire('/Users/alonsogcespedes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = dep('playwright');

const outDir = path.resolve(__dirname, '../docs/ui-review/screens');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  // 1. Desktop Screenshots (1440x960)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2, // Retina resolution
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000); // Wait for sample case load

  // Ensure Desktop view
  const switcherBtn = desktopPage.locator('button:has-text("Vista")');
  const btnText = await switcherBtn.innerText();
  if (btnText.includes('Vista Móvil')) {
    // Already in mobile or override, let's make sure it's desktop
    // On 1440 width it defaults to desktop unless overridden
  }

  // Capture Main Desktop Workbench
  await desktopPage.screenshot({ path: path.join(outDir, '01-desktop-workbench.png'), fullPage: true });
  console.log('Saved 01-desktop-workbench.png');

  // Toggle "Auditar aviso" form modal
  const auditBtn = desktopPage.locator('button:has-text("Auditar aviso")');
  await auditBtn.click();
  await desktopPage.waitForTimeout(400);
  await desktopPage.screenshot({ path: path.join(outDir, '02-desktop-audit-form.png') });
  console.log('Saved 02-desktop-audit-form.png');
  await auditBtn.click(); // Close form
  await desktopPage.waitForTimeout(300);

  // Switch to Contrato tab in middle column
  const contratoTabBtn = desktopPage.locator('button:has-text("Cláusulas y Letra Chica")');
  if (await contratoTabBtn.count() > 0) {
    await contratoTabBtn.click();
    await desktopPage.waitForTimeout(300);
    await desktopPage.screenshot({ path: path.join(outDir, '03-desktop-clausulas-tab.png') });
    console.log('Saved 03-desktop-clausulas-tab.png');
  }

  await desktopContext.close();

  // 2. Mobile Screenshots (iPhone 14 style: 390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Tab 1: Rayos-X
  await mobilePage.screenshot({ path: path.join(outDir, '04-mobile-tab-rayosx.png') });
  console.log('Saved 04-mobile-tab-rayosx.png');

  // Tab 2: Costo Real
  const tabCosto = mobilePage.locator('button:has-text("Costo Real")');
  await tabCosto.click();
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({ path: path.join(outDir, '05-mobile-tab-costo.png') });
  console.log('Saved 05-mobile-tab-costo.png');

  // Tab 3: Scorecard & Veto
  const tabScorecard = mobilePage.locator('button:has-text("Scorecard")');
  await tabScorecard.click();
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({ path: path.join(outDir, '06-mobile-tab-scorecard.png') });
  console.log('Saved 06-mobile-tab-scorecard.png');

  // Tab 4: WhatsApp
  const tabWhatsapp = mobilePage.locator('button:has-text("WhatsApp")');
  await tabWhatsapp.click();
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({ path: path.join(outDir, '07-mobile-tab-whatsapp.png') });
  console.log('Saved 07-mobile-tab-whatsapp.png');

  await mobileContext.close();
  await browser.close();
  console.log('All screenshots captured successfully in ' + outDir);
})();
