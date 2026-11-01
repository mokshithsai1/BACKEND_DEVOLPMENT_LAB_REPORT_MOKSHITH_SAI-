const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function takeScreenshot(url, outputPath) {
  const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --window-size=1200,800 --screenshot="${outputPath}" "${url}"`;
  console.log(`Taking screenshot of ${url} -> ${path.basename(outputPath)}`);
  execSync(cmd, { stdio: 'inherit' });
}

async function renderHtmlCard(title, method, endpoint, status, body, filename) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
    .card { background: #1e293b; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); overflow: hidden; max-width: 900px; margin: 0 auto; }
    .header { background: #0f172a; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; }
    .title { font-size: 18px; font-weight: bold; color: #38bdf8; }
    .badge { padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 14px; }
    .method-get { background: #0284c7; color: white; }
    .method-post { background: #16a34a; color: white; }
    .method-put { background: #d97706; color: white; }
    .method-delete { background: #dc2626; color: white; }
    .status { background: #334155; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 13px; color: #4ade80; }
    .status-404 { color: #f87171; }
    .content { padding: 24px; }
    .endpoint { font-size: 16px; font-family: monospace; color: #94a3b8; margin-bottom: 16px; background: #090d16; padding: 10px 14px; border-radius: 8px; border: 1px solid #1e293b; }
    pre { background: #090d16; padding: 16px; border-radius: 8px; overflow-x: auto; color: #e2e8f0; font-size: 14px; line-height: 1.5; border: 1px solid #1e293b; }
    .student { font-size: 12px; color: #64748b; margin-top: 14px; text-align: right; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">${title}</div>
      <div>
        <span class="badge method-${method.toLowerCase()}">${method}</span>
        <span class="status ${status.startsWith('4') ? 'status-404' : ''}">${status}</span>
      </div>
    </div>
    <div class="content">
      <div class="endpoint"><strong>Request:</strong> ${method} http://localhost:3000${endpoint}</div>
      <div style="font-size: 13px; color: #94a3b8; margin-bottom: 6px;">Response Payload:</div>
      <pre><code>${typeof body === 'string' ? body : JSON.stringify(body, null, 2)}</code></pre>
      <div class="student">Student: N.G.Mokshith Sai (252U1R8066) · Section: CSE-QE-2B · Faculty: Sai Shiva Teja</div>
    </div>
  </div>
</body>
</html>`;

  const tempHtmlPath = path.join(__dirname, 'temp_render.html');
  fs.writeFileSync(tempHtmlPath, html, 'utf8');
  takeScreenshot(`file://${tempHtmlPath}`, path.join(SCREENSHOTS_DIR, filename));
  if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
}

async function run() {
  console.log('--- Step 1: Re-seeding database ---');
  execSync(`node "${path.join(__dirname, 'seed.js')}"`, { stdio: 'inherit' });

  console.log('\n--- Step 2: Starting Express & SQLite Server ---');
  const serverProc = spawn('node', [path.join(__dirname, 'server.js')], { stdio: 'inherit' });
  await wait(2000);

  try {
    // 1. GET /books/
    console.log('\nTesting GET /books/...');
    const rAll = await fetch('http://127.0.0.1:3000/books/');
    const jAll = await rAll.json();
    console.log(`Status: ${rAll.status}, Retrieved ${jAll.length} books.`);
    await renderHtmlCard('Lab 2: Retrieve All Books', 'GET', '/books/', `${rAll.status} OK`, jAll.slice(0, 5).concat([{ "...": `${jAll.length - 5} more books in database` }]), '01-get-all-books.png');

    // 2. GET /books/3/
    console.log('\nTesting GET /books/3/...');
    const rOne = await fetch('http://127.0.0.1:3000/books/3/');
    const jOne = await rOne.json();
    console.log(`Status: ${rOne.status}, Retrieved:`, jOne);
    await renderHtmlCard('Lab 2: Retrieve Single Book by ID', 'GET', '/books/3/', `${rOne.status} OK`, jOne, '02-get-single-book.png');

    // 3. POST /books/
    console.log('\nTesting POST /books/...');
    const newBook = {
      title: "Clean Code",
      author: "Robert C. Martin",
      price: 799,
      pages: 464
    };
    const rPost = await fetch('http://127.0.0.1:3000/books/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBook)
    });
    const jPost = await rPost.json();
    console.log(`Status: ${rPost.status}, Created:`, jPost);
    await renderHtmlCard('Lab 2: Add New Book (POST)', 'POST', '/books/', `${rPost.status} Created`, { payloadSent: newBook, response: jPost }, '03-post-add-book.png');

    // 4. PUT /books/1/
    console.log('\nTesting PUT /books/1/...');
    const updatedBook = {
      title: "The Great Gatsby (Special Deluxe Edition)",
      author: "F. Scott Fitzgerald",
      price: 549,
      pages: 200
    };
    const rPut = await fetch('http://127.0.0.1:3000/books/1/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBook)
    });
    const jPut = await rPut.json();
    console.log(`Status: ${rPut.status}, Updated:`, jPut);
    await renderHtmlCard('Lab 2: Update Book (PUT)', 'PUT', '/books/1/', `${rPut.status} OK`, { payloadSent: updatedBook, response: jPut }, '04-put-update-book.png');

    // 5. DELETE /books/10/
    console.log('\nTesting DELETE /books/10/...');
    const rDelete = await fetch('http://127.0.0.1:3000/books/10/', {
      method: 'DELETE'
    });
    const jDelete = await rDelete.json();
    console.log(`Status: ${rDelete.status}, Deleted:`, jDelete);
    await renderHtmlCard('Lab 2: Remove Book (DELETE)', 'DELETE', '/books/10/', `${rDelete.status} OK`, jDelete, '05-delete-book.png');

    // 6. GET /books/999/ (404 Not Found)
    console.log('\nTesting 404 Not Found on invalid ID...');
    const r404 = await fetch('http://127.0.0.1:3000/books/999/');
    const j404 = await r404.json();
    console.log(`Status: ${r404.status}, Error response:`, j404);
    await renderHtmlCard('Lab 2: 404 Not Found Error Handling', 'GET', '/books/999/', `${r404.status} Not Found`, j404, '06-error-404-not-found.png');

    console.log('\nAll Lab 2 tests & screenshots completed successfully!');
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    serverProc.kill();
    await wait(500);
  }
}

run();
