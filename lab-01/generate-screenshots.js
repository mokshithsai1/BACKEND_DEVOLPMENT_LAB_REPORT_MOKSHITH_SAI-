const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function takeScreenshot(url, outputPath) {
  const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --window-size=1200,800 --screenshot="${outputPath}" "${url}"`;
  console.log(`Taking screenshot of ${url} -> ${path.basename(outputPath)}`);
  execSync(cmd, { stdio: 'inherit' });
}

async function run() {
  console.log('--- Step 1: Testing Plain HTTP Server ---');
  const httpProc = spawn('node', [path.join(__dirname, 'http-server.js')], { stdio: 'inherit' });
  await wait(1500);

  try {
    const res = await fetch('http://127.0.0.1:3000/');
    const text = await res.text();
    console.log(`[HTTP Server] GET / -> Status: ${res.status}, Response: "${text}"`);
    takeScreenshot('http://127.0.0.1:3000/', path.join(SCREENSHOTS_DIR, '01-plain-http-hello.png'));
  } catch (err) {
    console.error('Error querying plain http server:', err.message);
  } finally {
    httpProc.kill();
    await wait(1000);
  }

  console.log('\n--- Step 2: Testing Express Server & All Routes ---');
  const expressProc = spawn('node', [path.join(__dirname, 'server.js')], { stdio: 'inherit' });
  await wait(1500);

  try {
    // 1. GET /
    const rRoot = await fetch('http://127.0.0.1:3000/');
    const tRoot = await rRoot.text();
    console.log(`[Express] GET / -> Status: ${rRoot.status}, Response: "${tRoot}"`);
    takeScreenshot('http://127.0.0.1:3000/', path.join(SCREENSHOTS_DIR, '02-express-root-welcome.png'));

    // 2. GET /about
    const rAbout = await fetch('http://127.0.0.1:3000/about');
    const jAbout = await rAbout.json();
    console.log(`[Express] GET /about -> Status: ${rAbout.status}, Response:`, JSON.stringify(jAbout, null, 2));
    takeScreenshot('http://127.0.0.1:3000/about', path.join(SCREENSHOTS_DIR, '03-express-about-json.png'));

    // 3. GET /time
    const rTime = await fetch('http://127.0.0.1:3000/time');
    const jTime = await rTime.json();
    console.log(`[Express] GET /time -> Status: ${rTime.status}, Response:`, JSON.stringify(jTime, null, 2));
    takeScreenshot('http://127.0.0.1:3000/time', path.join(SCREENSHOTS_DIR, '04-express-time-json.png'));

    // 4. GET /non-existent (404)
    const r404 = await fetch('http://127.0.0.1:3000/some-invalid-route');
    const j404 = await r404.json();
    console.log(`[Express] GET /some-invalid-route -> Status: ${r404.status}, Response:`, JSON.stringify(j404, null, 2));
    takeScreenshot('http://127.0.0.1:3000/some-invalid-route', path.join(SCREENSHOTS_DIR, '05-express-404-not-found.png'));

    console.log('\nAll screenshots taken successfully!');
  } catch (err) {
    console.error('Error querying express server:', err.message);
  } finally {
    expressProc.kill();
    await wait(500);
  }
}

run();
