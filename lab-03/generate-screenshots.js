const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, maxAttempts = 25) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.status) return true;
    } catch (e) {
      await wait(500);
    }
  }
  throw new Error(`Server did not become ready at ${url}`);
}

function takeScreenshotFromFile(htmlFilePath, outputPath) {
  const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --window-size=1200,850 --screenshot="${outputPath}" "file://${htmlFilePath}"`;
  console.log(`Generating screenshot: ${path.basename(outputPath)}`);
  execSync(cmd, { stdio: 'inherit' });
}

function renderHtmlCard(title, method, endpoint, status, body, filename) {
  const is2xx = status.startsWith('2');
  const is4xx = status.startsWith('4');
  const statusClass = is2xx ? 'status-2xx' : (is4xx ? 'status-4xx' : 'status-5xx');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #0f172a; color: #f8fafc; margin: 0; padding: 30px; }
    .card { background: #1e293b; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); overflow: hidden; max-width: 950px; margin: 0 auto; }
    .header { background: #0f172a; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; }
    .title { font-size: 18px; font-weight: bold; color: #38bdf8; }
    .badge { padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
    .method-get { background: #0284c7; color: white; }
    .method-post { background: #16a34a; color: white; }
    .method-put { background: #d97706; color: white; }
    .method-delete { background: #dc2626; color: white; }
    .status { padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; }
    .status-2xx { background: #064e3b; color: #34d399; border: 1px solid #059669; }
    .status-4xx { background: #450a0a; color: #f87171; border: 1px solid #b91c1c; }
    .status-5xx { background: #451a03; color: #fb923c; border: 1px solid #ea580c; }
    .content { padding: 20px 24px; }
    .endpoint { font-size: 15px; font-family: monospace; color: #94a3b8; margin-bottom: 14px; background: #090d16; padding: 10px 14px; border-radius: 8px; border: 1px solid #1e293b; }
    pre { background: #090d16; padding: 16px; border-radius: 8px; overflow-x: auto; color: #e2e8f0; font-size: 13px; line-height: 1.45; border: 1px solid #1e293b; max-height: 480px; }
    .student { font-size: 12px; color: #64748b; margin-top: 14px; text-align: right; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">${title}</div>
      <div>
        <span class="badge method-${method.toLowerCase()}">${method}</span>
        <span class="status ${statusClass}">${status}</span>
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
  takeScreenshotFromFile(tempHtmlPath, path.join(SCREENSHOTS_DIR, filename));
  if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
}

async function run() {
  console.log('--- Step 1: Re-seeding Lab 3 database ---');
  execSync(`node "${path.join(__dirname, 'seed.js')}"`, { stdio: 'inherit' });

  console.log('\n--- Step 2: Starting Express & SQLite Server ---');
  const serverProc = spawn('node', [path.join(__dirname, 'server.js')], { stdio: 'inherit' });

  const testResults = [];

  try {
    await waitForServer('http://127.0.0.1:3000/');
    console.log('Lab 3 Server verified ready!\n');

    // 0. Root Endpoint: GET /
    console.log('Executing: GET /');
    const rRoot = await fetch('http://127.0.0.1:3000/');
    const jRoot = await rRoot.json();
    testResults.push({
      title: 'Lab 3: Root Overview & Student Details',
      method: 'GET',
      endpoint: '/',
      status: `${rRoot.status} OK`,
      body: jRoot,
      filename: '00-root-api-overview.png'
    });

    // 1. Search Query: GET /books/?search_q=The
    console.log('Executing: GET /books/?search_q=The');
    const rSearch = await fetch('http://127.0.0.1:3000/books/?search_q=The');
    const jSearch = await rSearch.json();
    testResults.push({
      title: 'Lab 3: Search Query (search_q=The)',
      method: 'GET',
      endpoint: '/books/?search_q=The',
      status: `${rSearch.status} OK`,
      body: jSearch,
      filename: '01-get-books-search.png'
    });

    // 2. Price Range Filter: GET /books/?min_price=400&max_price=500
    console.log('Executing: GET /books/?min_price=400&max_price=500');
    const rPrice = await fetch('http://127.0.0.1:3000/books/?min_price=400&max_price=500');
    const jPrice = await rPrice.json();
    testResults.push({
      title: 'Lab 3: Price Range Filter (BETWEEN 400 AND 500)',
      method: 'GET',
      endpoint: '/books/?min_price=400&max_price=500',
      status: `${rPrice.status} OK`,
      body: jPrice,
      filename: '02-get-books-price-range.png'
    });

    // 3. Sorting & Pagination: GET /books/?order_by=price&order=DESC&limit=4&offset=0
    console.log('Executing: GET /books/?order_by=price&order=DESC&limit=4&offset=0');
    const rSort = await fetch('http://127.0.0.1:3000/books/?order_by=price&order=DESC&limit=4&offset=0');
    const jSort = await rSort.json();
    testResults.push({
      title: 'Lab 3: Sorting & Pagination (order_by=price, DESC, limit=4)',
      method: 'GET',
      endpoint: '/books/?order_by=price&order=DESC&limit=4&offset=0',
      status: `${rSort.status} OK`,
      body: jSort,
      filename: '03-get-books-sort-pagination.png'
    });

    // 4. Single Book: GET /books/3
    console.log('Executing: GET /books/3');
    const rSingle = await fetch('http://127.0.0.1:3000/books/3');
    const jSingle = await rSingle.json();
    testResults.push({
      title: 'Lab 3: Retrieve Single Book (ID: 3)',
      method: 'GET',
      endpoint: '/books/3',
      status: `${rSingle.status} OK`,
      body: jSingle,
      filename: '04-get-single-book-200.png'
    });

    // 5. Valid POST: POST /books (201 Created)
    console.log('Executing: POST /books (Valid body)');
    const newBook = {
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      price: 850,
      pages: 616
    };
    const rPostOk = await fetch('http://127.0.0.1:3000/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBook)
    });
    const jPostOk = await rPostOk.json();
    testResults.push({
      title: 'Lab 3: Create Book (201 Created)',
      method: 'POST',
      endpoint: '/books',
      status: `${rPostOk.status} Created`,
      body: { requestPayload: newBook, response: jPostOk },
      filename: '05-post-create-book-201.png'
    });

    // 6. Invalid POST: POST /books (400 Bad Request - Validation Error)
    console.log('Executing: POST /books (Validation error - non-numeric price)');
    const invalidBook = {
      title: "Broken Book",
      author: "Anonymous",
      price: "NOT_A_NUMBER",
      pages: 100
    };
    const rPostErr = await fetch('http://127.0.0.1:3000/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidBook)
    });
    const jPostErr = await rPostErr.json();
    testResults.push({
      title: 'Lab 3: Validation Error (400 Bad Request)',
      method: 'POST',
      endpoint: '/books',
      status: `${rPostErr.status} Bad Request`,
      body: { invalidPayloadSent: invalidBook, errorResponse: jPostErr },
      filename: '06-post-validation-error-400.png'
    });

    // 7. Update Book: PUT /books/1 (200 OK)
    console.log('Executing: PUT /books/1');
    const updatedBook = {
      title: "The Great Gatsby (Centennial Edition)",
      author: "F. Scott Fitzgerald",
      price: 520,
      pages: 195
    };
    const rPut = await fetch('http://127.0.0.1:3000/books/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBook)
    });
    const jPut = await rPut.json();
    testResults.push({
      title: 'Lab 3: Update Book (200 OK)',
      method: 'PUT',
      endpoint: '/books/1',
      status: `${rPut.status} OK`,
      body: { updatePayload: updatedBook, response: jPut },
      filename: '07-put-update-book-200.png'
    });

    // 8. Delete Book: DELETE /books/12 (200 OK)
    console.log('Executing: DELETE /books/12');
    const rDelete = await fetch('http://127.0.0.1:3000/books/12', {
      method: 'DELETE'
    });
    const jDelete = await rDelete.json();
    testResults.push({
      title: 'Lab 3: Delete Book (200 OK)',
      method: 'DELETE',
      endpoint: '/books/12',
      status: `${rDelete.status} OK`,
      body: jDelete,
      filename: '08-delete-book-200.png'
    });

    // 9. Missing Record: GET /books/999 (404 Not Found)
    console.log('Executing: GET /books/999');
    const r404 = await fetch('http://127.0.0.1:3000/books/999');
    const j404 = await r404.json();
    testResults.push({
      title: 'Lab 3: Missing Record (404 Not Found)',
      method: 'GET',
      endpoint: '/books/999',
      status: `${r404.status} Not Found`,
      body: j404,
      filename: '09-missing-record-404.png'
    });

  } catch (err) {
    console.error('Error during HTTP tests:', err);
  } finally {
    serverProc.kill();
    await wait(800);
  }

  console.log('\n--- Step 3: Rendering screenshots from captured responses ---');
  for (const item of testResults) {
    renderHtmlCard(item.title, item.method, item.endpoint, item.status, item.body, item.filename);
  }

  console.log('\nAll Lab 3 test scenarios & screenshots generated successfully!');
}

run();
