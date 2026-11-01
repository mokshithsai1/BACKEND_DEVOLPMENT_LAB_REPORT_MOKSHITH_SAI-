const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, 'goodreads.db');
const sqlPath = path.join(__dirname, 'init.sql');

async function seedDatabase() {
  console.log(`Initializing SQLite database at: ${dbPath}`);
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const initSql = fs.readFileSync(sqlPath, 'utf8');
  await db.exec(initSql);

  const books = await db.all('SELECT * FROM book ORDER BY id ASC;');
  console.log(`Database seeded successfully! Total books inserted: ${books.length}`);
  console.table(books);

  await db.close();
}

seedDatabase().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
