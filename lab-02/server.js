/**
 * Lab 2: SQLite database and CRUD routes
 * Student: N.G.Mokshith Sai (252U1R8066) · CSE-QE-2B
 * Course: Backend Development Fundamentals · Year II Term II · Aurora
 * Faculty: Sai Shiva Teja
 */

const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'goodreads.db');

let db = null;

// Request & Status Code Logger Middleware
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

// Root Route: API Overview
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 2: SQLite database and CRUD routes API',
    student: {
      name: 'N.G.Mokshith Sai',
      registrationNumber: '252U1R8066',
      section: 'CSE-QE-2B',
      faculty: 'Sai Shiva Teja'
    },
    endpoints: {
      'GET /books/': 'Retrieve all books',
      'GET /books/:bookId/': 'Retrieve a single book by ID',
      'POST /books/': 'Add a new book',
      'PUT /books/:bookId/': 'Update an existing book by ID',
      'DELETE /books/:bookId/': 'Delete a book by ID'
    }
  });
});

// Task 4.1: GET /books/ (Retrieve all books)
app.get('/books/', async (req, res) => {
  try {
    const getBooksQuery = `
      SELECT *
      FROM book
      ORDER BY id ASC;
    `;
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Task 4.2: GET /books/:bookId/ (Retrieve a single book)
app.get('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    // Parameterized query using ? placeholder (Task 5)
    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({
        error: 'Book Not Found',
        message: `Book with ID ${bookId} does not exist.`
      });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching book:', error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Task 4.3: POST /books/ (Add a new book)
app.post('/books/', async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'All fields (title, author, price, pages) are required.'
      });
    }

    // Parameterized query using ? placeholders (Task 5)
    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [title, author, price, pages]);

    res.status(201).json({
      message: 'Book Added Successfully',
      bookId: result.lastID
    });
  } catch (error) {
    console.error('Error adding book:', error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Task 4.4: PUT /books/:bookId/ (Update an existing book)
app.put('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'All fields (title, author, price, pages) are required.'
      });
    }

    // Parameterized query using ? placeholders (Task 5)
    const updateBookQuery = `
      UPDATE book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE id = ?;
    `;
    const result = await db.run(updateBookQuery, [title, author, price, pages, bookId]);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Book Not Found',
        message: `Cannot update. Book with ID ${bookId} does not exist.`
      });
    }

    res.status(200).json({
      message: 'Book Updated Successfully',
      bookId: Number(bookId)
    });
  } catch (error) {
    console.error('Error updating book:', error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Task 4.5: DELETE /books/:bookId/ (Remove a book)
app.delete('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    // Parameterized query using ? placeholder (Task 5)
    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `;
    const result = await db.run(deleteBookQuery, [bookId]);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Book Not Found',
        message: `Cannot delete. Book with ID ${bookId} does not exist.`
      });
    }

    res.status(200).json({
      message: 'Book Deleted Successfully',
      bookId: Number(bookId)
    });
  } catch (error) {
    console.error('Error deleting book:', error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Catch-all 404 Route for undefined paths
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `Path '${req.originalUrl}' does not exist on this server.`
  });
});

// Task 3: initializeDBAndServer() async function
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Ensure table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `);

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` SQLite Database & Express Server initialized!`);
      console.log(` Server running at: http://localhost:${PORT}/`);
      console.log(` Database connected: ${dbPath}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Start the database and server
initializeDBAndServer();

module.exports = app;
