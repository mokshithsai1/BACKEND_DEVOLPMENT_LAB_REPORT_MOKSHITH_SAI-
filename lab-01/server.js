/**
 * Lab 1 - Task 4, 5, 6, 7: Express Server
 * Course: Backend Development Fundamentals · Year II Term II · Aurora
 * Faculty: Sai Shiva Teja
 */

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Student details
const studentInfo = {
  name: process.env.STUDENT_NAME || 'N.G.Mokshith Sai',
  registrationNumber: process.env.STUDENT_REG_NO || '252U1R8066',
  section: process.env.STUDENT_SECTION || 'CSE-QE-2B',
  course: 'Backend Development Fundamentals',
  faculty: process.env.FACULTY_NAME || 'Sai Shiva Teja'
};

// Middleware: Request & Status Code Logger (Task 7)
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status Code: ${res.statusCode} (${elapsed}ms)`
    );
  });
  next();
});

// Task 5 Route 1: GET / (Welcome text)
app.get('/', (req, res) => {
  res.status(200).send('Welcome to Lab 1: Node.js and Express Server!');
});

// Task 5 Route 2: GET /about (JSON with name and section)
app.get('/about', (req, res) => {
  res.status(200).json({
    name: studentInfo.name,
    registrationNumber: studentInfo.registrationNumber,
    section: studentInfo.section,
    course: studentInfo.course,
    faculty: studentInfo.faculty
  });
});

// Task 5 Route 3: GET /time (Current date and time using new Date())
app.get('/time', (req, res) => {
  const now = new Date();
  res.status(200).json({
    iso: now.toISOString(),
    utc: now.toUTCString(),
    local: now.toString(),
    timestamp: now.getTime()
  });
});

// Task 6: Return a 404 message for any unknown path
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `The requested path '${req.originalUrl}' does not exist on this server.`
  });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Express Server is running!`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Endpoints:`);
  console.log(`   - GET  /         (Welcome message)`);
  console.log(`   - GET  /about    (Student details in JSON)`);
  console.log(`   - GET  /time     (Current date & time)`);
  console.log(`   - Any other path (404 Not Found response)`);
  console.log(`====================================================`);
});

module.exports = app;
