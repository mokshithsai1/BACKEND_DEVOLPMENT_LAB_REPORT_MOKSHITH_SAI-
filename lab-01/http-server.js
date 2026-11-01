/**
 * Lab 1 - Task 3: Plain Node.js HTTP Server
 * Uses the built-in 'http' module to reply "Hello" on port 3000.
 */

const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Log incoming request and status code
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Status Code: 200`);

  // Send "Hello" response
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Hello');
});

server.listen(PORT, () => {
  console.log(`Plain Node.js HTTP server listening on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
