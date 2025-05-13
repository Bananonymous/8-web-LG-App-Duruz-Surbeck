import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Setup require for ESM
const require = createRequire(import.meta.url);
const cardUtils = require('./lib/cardUtils.js');

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database with detailed logging
const db = new Database(path.join(__dirname, 'database.sqlite'), {
  verbose: process.env.DEBUG ? console.log : null
});

// Configure logging
const log = {
  info: (message) => console.log(`[INFO][${new Date().toISOString()}] ${message}`),
  error: (message, error) => console.error(`[ERROR][${new Date().toISOString()}] ${message}`, error),
  success: (message) => console.log(`[SUCCESS][${new Date().toISOString()}] ${message}`)
};

// Read the SQL file
log.info('Reading SQL file for card additions...');
let sql;
try {
  sql = fs.readFileSync(path.join(__dirname, 'add_cards.sql'), 'utf8');
} catch (error) {
  log.error('Failed to read SQL file:', error);
  process.exit(1);
}

// Parse card data from SQL (attempt to extract card objects from INSERT statements)
let cardData = [];
try {
  const insertMatches = sql.matchAll(/INSERT\s+INTO\s+cards\s+\([^)]+\)\s+VALUES\s+\(([^)]+)\)/gi);
  for (const match of insertMatches) {
    if (match[1]) {
      const values = match[1].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
      // This is a simplified approach - proper SQL parsing would be more robust
      cardData.push({
        name: values[0],
        team: values[1]
      });
    }
  }
  log.info(`Extracted ${cardData.length} card entries from SQL file`);
} catch (parseError) {
  log.error('Failed to parse card data from SQL:', parseError);
  // Continue execution - this is just an additional validation step
}

// Split the SQL file into individual statements
const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
log.info(`Found ${statements.length} SQL statements to execute`);

// Verify database connection before proceeding
try {
  const dbVersion = db.prepare('SELECT sqlite_version() as version').get();
  log.info(`Connected to SQLite database (version ${dbVersion.version})`);

  // Get current card count
  const cardCountBefore = db.prepare('SELECT COUNT(*) as count FROM cards').get().count;
  log.info(`Current card count: ${cardCountBefore}`);
} catch (dbError) {
  log.error('Failed to connect to database:', dbError);
  process.exit(1);
}

// Begin a transaction
log.info('Starting transaction...');
db.exec('BEGIN TRANSACTION;');

try {
  // Execute each statement with individual error handling
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (statement) {
      try {
        db.exec(statement + ';');
        if (statements.length <= 10 || i % Math.ceil(statements.length / 10) === 0) {
          log.info(`Processed ${i + 1}/${statements.length} statements (${Math.round((i + 1) / statements.length * 100)}%)`);
        }
      } catch (stmtError) {
        log.error(`Error in statement #${i + 1}: ${statement.substring(0, 100)}...`, stmtError);
        throw new Error(`Failed at statement #${i + 1}: ${stmtError.message}`);
      }
    }
  }

  // Verify the changes before committing
  const cardCountAfter = db.prepare('SELECT COUNT(*) as count FROM cards').get().count;
  const cardsAdded = cardCountAfter - cardCountBefore;

  if (cardsAdded > 0) {
    // Commit the transaction
    db.exec('COMMIT;');
    log.success(`Transaction committed successfully. Added ${cardsAdded} new cards.`);

    // Get all cards to validate them
    const allCards = db.prepare('SELECT * FROM cards ORDER BY id').all();

    // Additional validation - check for any card ID gaps using our utility
    const idCheck = cardUtils.checkCardIdIntegrity(allCards);
    if (idCheck.hasGaps) {
      log.error(`Found gaps in card IDs between ${idCheck.minId} and ${idCheck.maxId}`);
      log.info('Consider running the ID fix utility: node server.cjs /api/fix-card-ids');
    }

    // Validate newly added cards
    const newCards = allCards.slice(-cardsAdded);
    const invalidCards = [];

    newCards.forEach(card => {
      const validation = cardUtils.validateCard(card);
      if (!validation.valid) {
        invalidCards.push({
          id: card.id,
          name: card.name || 'Unknown',
          error: validation.error
        });
      }
    });

    if (invalidCards.length > 0) {
      log.error(`Found ${invalidCards.length} invalid cards:`);
      invalidCards.forEach(card => {
        console.log(`  ID ${card.id} - ${card.name}: ${card.error}`);
      });
      log.info('These cards might need additional data to be fully functional.');
    } else {
      log.success('All newly added cards are valid.');
    }
  } else {
    // No cards were added
    db.exec('ROLLBACK;');
    log.info('Transaction rolled back as no new cards were added. Check your SQL statements.');
  }
} catch (error) {
  // Rollback the transaction in case of error
  db.exec('ROLLBACK;');
  log.error('Transaction rolled back due to error:', error);

  // Provide recovery suggestions
  log.info('Recovery suggestions:');
  log.info('1. Check the SQL syntax in add_cards.sql');
  log.info('2. Ensure all required card fields are provided');
  log.info('3. Check for duplicate entries that might violate constraints');
  log.info('4. Verify database schema matches expected structure');

  // Exit with error code
  process.exit(1);
} finally {
  // Close the database connection
  db.close();
  log.info('Database connection closed');
}
