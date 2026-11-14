// Makes animations/<id>/thumb.png (640x360) for each animation in catalog.json by
// screenshotting its diagram after it has run for a couple of seconds.
// Run after tools/build.py:  node tools/thumbs.js   (needs Node with Playwright and Chromium)
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const { animations } = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, colorScheme: 'light' });
  for (const a of animations) {
    const dir = path.join(root, 'animations', a.id);
    await page.goto('file://' + path.join(dir, 'index.html'));
    await page.waitForTimeout(2000);
    const shot = path.join(dir, 'thumb-full.png');
    await page.locator('canvas').first().screenshot({ path: shot });
    // shrink to 640x360 with the browser itself, so no image library is needed
    const data = fs.readFileSync(shot).toString('base64'); fs.unlinkSync(shot);
    const small = await page.evaluate(async src => {
      const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
      const c = document.createElement('canvas'); c.width = 640; c.height = 360;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, 640, 360);
      return c.toDataURL('image/png').split(',')[1];
    }, data);
    fs.writeFileSync(path.join(dir, 'thumb.png'), Buffer.from(small, 'base64'));
    console.log('Wrote animations/' + a.id + '/thumb.png');
  }
  await browser.close();
})();
