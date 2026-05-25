const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const DIAGRAMS_DIR = path.join(__dirname, 'diagrams');
if (!fs.existsSync(DIAGRAMS_DIR)) fs.mkdirSync(DIAGRAMS_DIR, { recursive: true });

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function findBrowser() {
  for (const p of EDGE_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function exportOne(page, xml) {
  await page.goto('https://viewer.diagrams.net/export3.html', {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  await page.evaluate(
    (arg) => {
      return render(arg);
    },
    { xml, format: 'png', scale: 2, bg: '#ffffff', border: 10 }
  );

  await page.waitForSelector('#LoadingComplete', { timeout: 30000 });

  const bounds = await page.$eval('#LoadingComplete', (el) => el.getAttribute('bounds'));
  if (bounds) {
    const b = JSON.parse(bounds);
    const w = Math.ceil(b.width + b.x);
    const h = Math.ceil(b.height + b.y);
    await page.setViewport({ width: w, height: h });
  }

  return page.screenshot({ type: 'png', fullPage: true, omitBackground: false });
}

async function main() {
  const executablePath = findBrowser();
  if (!executablePath) {
    console.error('Chrome/Edge introuvable. Installez Microsoft Edge ou Google Chrome.');
    process.exit(1);
  }

  console.log('Browser:', executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  let ok = 0;
  let fail = 0;

  // Find all .drawio files in the current directory
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.drawio'));

  for (const file of files) {
    const src = path.join(__dirname, file);
    const pngName = file.replace('.drawio', '.png');
    const dest = path.join(DIAGRAMS_DIR, pngName);
    
    try {
      const xml = fs.readFileSync(src, 'utf8');
      const buf = await exportOne(page, xml);
      if (!buf || buf.length < 500) throw new Error('PNG trop petit');
      fs.writeFileSync(dest, buf);
      console.log(`OK ${pngName} (${Math.round(buf.length / 1024)} KB)`);
      ok++;
    } catch (e) {
      console.error(`FAIL ${file}: ${e.message}`);
      fail++;
    }
  }

  await browser.close();
  console.log(`\nExport: ${ok} OK, ${fail} failed → ${DIAGRAMS_DIR}`);

  // Create legacy compatibility copy maps
  const legacyMap = {
    'Global_Cas_Utilisation.png': ['use_case_global.png', 'use case global.png'],
    'Global_Classes.png': ['classe_global.png', 'classe global.png'],
    'Architecture_3_Tiers.png': ['architecture_3_tiers.png', 'architecture 3 tiers.png']
  };

  for (let n = 1; n <= 5; n++) {
    legacyMap[`Sprint${n}_Cas_Utilisation.png`] = [`use_case_sprint_${n}.png`, `use case sprint ${n}.png`];
    legacyMap[`Sprint${n}_Classes.png`] = [`classe_sprint_${n}.png`, `classe sprint ${n}.png`];
  }

  const sequenceFiles = {
    1: 'Sprint1_Sequence_Auth.png',
    2: 'Sprint2_Sequence_CoachingRequest.png',
    3: 'Sprint3_Sequence_SaveProgram.png',
    4: 'Sprint4_Sequence_LogMeal.png',
    5: 'Sprint5_Sequence_Message.png',
  };

  for (let n = 1; n <= 5; n++) {
    const orig = sequenceFiles[n];
    legacyMap[orig] = [`sequence_sprint_${n}.png`, `sequence sprint ${n}.png`];
  }

  for (const [orig, targets] of Object.entries(legacyMap)) {
    const s = path.join(DIAGRAMS_DIR, orig);
    if (fs.existsSync(s)) {
      for (const target of targets) {
        const d = path.join(DIAGRAMS_DIR, target);
        fs.copyFileSync(s, d);
      }
    }
  }

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
