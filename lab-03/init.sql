-- Lab 3: SQLite database schema and books dataset
DROP TABLE IF EXISTS book;

CREATE TABLE book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);

INSERT INTO book (title, author, price, pages) VALUES
  ('The Great Gatsby', 'F. Scott Fitzgerald', 499, 180),
  ('To Kill a Mockingbird', 'Harper Lee', 599, 281),
  ('1984', 'George Orwell', 450, 328),
  ('Pride and Prejudice', 'Jane Austen', 399, 279),
  ('The Catcher in the Rye', 'J.D. Salinger', 499, 214),
  ('The Hobbit', 'J.R.R. Tolkien', 699, 310),
  ('Fahrenheit 451', 'Ray Bradbury', 420, 249),
  ('Brave New World', 'Aldous Huxley', 480, 268),
  ('Crime and Punishment', 'Fyodor Dostoevsky', 650, 671),
  ('The Alchemist', 'Paulo Coelho', 350, 208),
  ('Clean Code', 'Robert C. Martin', 750, 464),
  ('JavaScript: The Good Parts', 'Douglas Crockford', 380, 176);
