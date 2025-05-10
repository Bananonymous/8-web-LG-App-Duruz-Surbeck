import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const db = new Database(path.join(__dirname, 'database.sqlite'), { verbose: console.log });

// Read the SQL file
const sql = fs.readFileSync(path.join(__dirname, 'add_cards.sql'), 'utf8');

// Execute the SQL statements
console.log('Adding new cards to the database...');

// Split the SQL file into individual statements
const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

// Begin a transaction
db.exec('BEGIN TRANSACTION;');

try {
  // Execute each statement
  for (const statement of statements) {
    if (statement.trim()) {
      db.exec(statement + ';');
    }
  }

  // Commit the transaction
  db.exec('COMMIT;');
  console.log('Cards added successfully!');
} catch (error) {
  // Rollback the transaction in case of error
  db.exec('ROLLBACK;');
  console.error('Error adding cards:', error.message);
}

// Close the database connection
db.close();
