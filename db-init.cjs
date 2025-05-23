/**
 * Database Initialization Module
 * Handles creating tables and populating initial data
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('./lib/logger.cjs');
const logger = createLogger('Database');

/**
 * Initialize the database with tables and default data
 * @param {Object} db - Better-SQLite3 database instance
 * @param {Object} options - Configuration options
 * @param {boolean} options.forceReset - Whether to force reset tables
 * @param {Object} options.credentials - Admin credentials
 */
function initializeDatabase(db, options = {}) {
  const { forceReset = false, credentials = {} } = options;
  const { username = 'admin', password = 'admin123' } = credentials;

  logger.info('Initializing database...');

  try {
    // If forceReset is true, delete all data
    if (forceReset) {
      logger.info('Force reset requested, clearing all tables...');
      clearDatabase(db);
    }

    // Initialize database using SQL file
    initializeDatabaseFromSqlFile(db, username, password);

    logger.success('Database initialization completed successfully');
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
}

/**
 * Clear all database tables
 * @param {Object} db - Better-SQLite3 database instance
 */
function clearDatabase(db) {
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

  // Begin transaction
  db.exec('BEGIN TRANSACTION;');

  try {
    // Drop all tables
    for (const table of tables) {
      db.exec(`DROP TABLE IF EXISTS ${table.name}`);
      logger.info(`Dropped table: ${table.name}`);
    }

    // Commit transaction
    db.exec('COMMIT;');
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * Initialize database from SQL file
 * @param {Object} db - Better-SQLite3 database instance
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 */
function initializeDatabaseFromSqlFile(db, username, password) {
  logger.info('Checking database initialization status...');

  try {
    // Check if database is already initialized by checking if tables exist
    const tablesExist = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name IN ('cards', 'users', 'variants')").get();

    // If tables already exist, only update admin credentials
    if (tablesExist.count >= 3) {
      logger.info('Database already initialized. Skipping SQL file execution.');
      // Update admin user credentials if provided
      updateAdminCredentials(db, username, password);
      return;
    }

    // If database is not initialized, proceed with initialization
    logger.info('Initializing database from SQL file...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'db-init.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    logger.info(`SQL file read successfully: ${sqlFilePath}`);

    // Execute the SQL content
    db.exec(sqlContent);

    // Update admin user credentials if provided
    updateAdminCredentials(db, username, password);

    logger.success('Database initialized successfully from SQL file');
  } catch (error) {
    logger.error(`Failed to initialize database from SQL file: ${error.message}`);
    throw error;
  }
}

/**
 * Update admin user credentials
 * @param {Object} db - Better-SQLite3 database instance
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 */
function updateAdminCredentials(db, username, password) {
  const bcrypt = require('bcryptjs');

  // Check if admin exists
  const adminExists = db.prepare('SELECT * FROM users WHERE is_admin = 1 LIMIT 1').get();

  if (adminExists) {
    logger.info('Updating admin credentials...');
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET username = ?, password = ? WHERE is_admin = 1').run(username, hashedPassword);
    logger.success(`Admin credentials updated for username: ${username}`);
  } else {
    logger.info('No admin user found, creating one...');
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)').run(username, hashedPassword, 1);
    logger.success(`Admin user created with username: ${username}`);
  }
}

module.exports = {
  initializeDatabase
};
