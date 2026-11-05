/**
 * Lab 3: REST API, query parameters, validation, debugging
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

// Root Route: API Overview matching exact faculty & lab reference format
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Lab 3 SQLite Books REST API with Search, Filter & Validation',
    endpoints: {
      getAllBooks: 'GET /books/?search_q=&order_by=&order=&limit=&offset=&min_price=&max_price=',
      getSingleBook: 'GET /books/:bookId',
      addBook: 'POST /books',
      updateBook: 'PUT /books/:bookId',
      deleteBook: 'DELETE /books/:bookId'
    },
    student: {
      name: process.env.STUDENT_NAME || 'N.G.Mokshith Sai',
      registrationNumber: process.env.STUDENT_REG_NO || '252U1R8066',
      section: process.env.STUDENT_SECTION || 'CSE-QE-2B',
      course: 'Backend Development Fundamentals',
      module: 'RESTful API development and validation',
      faculty: process.env.FACULTY_NAME || 'Sai Shiva Teja'
    }
  });
});

// Task 1 & 2 & 3: GET /books (with search_q, order_by, order, limit, offset, min_price, max_price)
app.get(['/books', '/books/'], async (req, res) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = 10,
      offset = 0,
      min_price,
      max_price
    } = req.query;

    const conditions = [];
    const params = [];

    // 1. Partial title match with LIKE (Task 2)
    if (search_q.trim() !== '') {
      conditions.push('title LIKE ?');
      params.push(`%${search_q.trim()}%`);
    }

    // 2. Price-range filter using BETWEEN or inequality conditions (Task 3)
    const hasMin = min_price !== undefined && min_price !== '' && !isNaN(min_price);
    const hasMax = max_price !== undefined && max_price !== '' && !isNaN(max_price);

    if (hasMin && hasMax) {
      conditions.push('price BETWEEN ? AND ?');
      params.push(Number(min_price), Number(max_price));
    } else if (hasMin) {
      conditions.push('price >= ?');
      params.push(Number(min_price));
    } else if (hasMax) {
      conditions.push('price <= ?');
      params.push(Number(max_price));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Whitelist order_by column to prevent SQL injection
    const allowedColumns = ['id', 'title', 'author', 'price', 'pages'];
    const validOrderBy = allowedColumns.includes(String(order_by).toLowerCase())
      ? String(order_by).toLowerCase()
      : 'id';

    // Whitelist sort direction
    const validOrder = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Parse numeric pagination parameters
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

    params.push(parsedLimit, parsedOffset);

    const getBooksQuery = `
      SELECT *
      FROM book
      ${whereClause}
      ORDER BY ${validOrderBy} ${validOrder}
      LIMIT ? OFFSET ?;
    `;

    const books = await db.all(getBooksQuery, params);

    res.status(200).json({
      total: books.length,
      filters: {
        search_q: search_q.trim(),
        order_by: validOrderBy,
        order: validOrder,
        limit: parsedLimit,
        offset: parsedOffset,
        min_price: hasMin ? Number(min_price) : null,
        max_price: hasMax ? Number(max_price) : null
      },
      books
    });
  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

// GET /books/:bookId (Retrieve single book by ID)
app.get(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID parameter. Must be a numeric value.' });
    }

    // Parameterized query using ? placeholder
    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ message: `Book with ID ${bookId} does not exist.` });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching book:', error.message);
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

// Task 4: POST /books (Validate POST body and insert)
app.post(['/books', '/books/'], async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Strict validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Validation failed: Title is required and cannot be empty.' });
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({ message: 'Validation failed: Author is required and cannot be empty.' });
    }

    if (price === undefined || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ message: 'Validation failed: Price must be a valid non-negative number.' });
    }

    if (pages === undefined || isNaN(pages) || Number(pages) <= 0 || !Number.isInteger(Number(pages))) {
      return res.status(400).json({ message: 'Validation failed: Pages must be a positive integer.' });
    }

    // Parameterized insert
    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [title.trim(), author.trim(), Number(price), Number(pages)]);

    // Task 5: Return 201 after create
    res.status(201).json({
      message: 'Book created successfully',
      bookId: result.lastID,
      book: {
        id: result.lastID,
        title: title.trim(),
        author: author.trim(),
        price: Number(price),
        pages: Number(pages)
      }
    });
  } catch (error) {
    console.error('Error adding book:', error.message);
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

// Task 4 & 5: PUT /books/:bookId (Update an existing book with validation)
app.put(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Validation failed: Book ID must be a numeric value.' });
    }

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Validation failed: Title is required and cannot be empty.' });
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({ message: 'Validation failed: Author is required and cannot be empty.' });
    }

    if (price === undefined || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ message: 'Validation failed: Price must be a valid non-negative number.' });
    }

    if (pages === undefined || isNaN(pages) || Number(pages) <= 0 || !Number.isInteger(Number(pages))) {
      return res.status(400).json({ message: 'Validation failed: Pages must be a positive integer.' });
    }

    // Parameterized update
    const updateBookQuery = `
      UPDATE book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE id = ?;
    `;
    const result = await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
      bookId
    ]);

    // Task 5: Return 404 when ID does not exist
    if (result.changes === 0) {
      return res.status(404).json({ message: `Book with ID ${bookId} does not exist.` });
    }

    // Task 5: Return 200 after update
    res.status(200).json({
      message: 'Book updated successfully',
      bookId: Number(bookId)
    });
  } catch (error) {
    console.error('Error updating book:', error.message);
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

// Task 5: DELETE /books/:bookId (Remove a book)
app.delete(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Validation failed: Book ID must be a numeric value.' });
    }

    // Parameterized delete
    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `;
    const result = await db.run(deleteBookQuery, [bookId]);

    // Task 5: Return 404 when ID does not exist
    if (result.changes === 0) {
      return res.status(404).json({ message: `Book with ID ${bookId} does not exist.` });
    }

    // Task 5: Return 200 after delete
    res.status(200).json({
      message: 'Book deleted successfully',
      bookId: Number(bookId)
    });
  } catch (error) {
    console.error('Error deleting book:', error.message);
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

// Catch-all 404 Route for undefined paths (Task 6: Consistent error message format)
app.use((req, res) => {
  res.status(404).json({
    message: `Path '${req.originalUrl}' does not exist on this server.`
  });
});

// Initialize Database & Server
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
      console.log(` Lab 3: REST API Server running!`);
      console.log(` URL: http://localhost:${PORT}/`);
      console.log(` Database connected: ${dbPath}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

module.exports = app;
