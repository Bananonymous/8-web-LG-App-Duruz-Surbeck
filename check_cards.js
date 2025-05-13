import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Setup require for ESM
const require = createRequire(import.meta.url);
const cardUtils = require('./lib/cardUtils.js');

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logging
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, error) => console.error(`[ERROR] ${message}`, error),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  section: (title) => console.log(`\n===== ${title} =====`)
};

// Connect to the database
const db = new Database(path.join(__dirname, 'database.sqlite'), {
  verbose: process.env.DEBUG ? console.log : null
});

try {
  // Query to get all cards
  const cards = db.prepare('SELECT * FROM cards ORDER BY team, name').all();

  log.section('DATABASE SUMMARY');
  log.info(`Total cards in database: ${cards.length}`);

  // Check card ID integrity
  log.section('CARD ID INTEGRITY CHECK');
  const idCheck = cardUtils.checkCardIdIntegrity(cards);
  log.info(idCheck.message);

  if (idCheck.hasGaps) {
    log.info(`ID range: ${idCheck.minId} to ${idCheck.maxId} (should be 1 to ${cards.length})`);
    log.info('Consider running: node server.cjs /api/fix-card-ids');
  }

  if (idCheck.hasDuplicates) {
    log.error('Duplicate IDs found! This can cause serious issues.');
  }

  // Validate all cards
  log.section('CARD VALIDATION');
  const invalidCards = [];
  cards.forEach(card => {
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
  } else {
    log.success('All cards are valid.');
  }

  // Group cards by team
  log.section('CARDS BY TEAM');
  const cardsByTeam = {};
  cards.forEach(card => {
    if (!cardsByTeam[card.team]) {
      cardsByTeam[card.team] = [];
    }
    cardsByTeam[card.team].push(card);
  });

  // Print cards by team
  Object.keys(cardsByTeam).sort().forEach(team => {
    console.log(`\n${team} (${cardsByTeam[team].length} cards):`);
    cardsByTeam[team]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(card => {
        console.log(`  ${card.id}. ${card.name}${card.is_custom ? ' (custom)' : ''}`);
      });
  });

  // Night roles analysis
  log.section('NIGHT ROLES ANALYSIS');
  const nightCards = cards.filter(card => card.wakes_up_at_night === 1);
  log.info(`Total night roles: ${nightCards.length} (${Math.round(nightCards.length / cards.length * 100)}% of all cards)`);

  // Group night cards by frequency
  const frequencyGroups = {
    'every_night': nightCards.filter(c => c.wakes_up_every_night === 1 && !c.wake_up_frequency),
    'first_night_only': nightCards.filter(c => c.wake_up_frequency === 'first_night_only'),
    'other_frequency': nightCards.filter(c => c.wake_up_frequency && c.wake_up_frequency !== 'first_night_only')
  };

  console.log('\nNight roles by frequency:');
  console.log(`  Every night: ${frequencyGroups.every_night.length} cards`);
  console.log(`  First night only: ${frequencyGroups.first_night_only.length} cards`);
  console.log(`  Custom frequency: ${frequencyGroups.other_frequency.length} cards`);

  if (frequencyGroups.other_frequency.length > 0) {
    console.log('\nRoles with custom wake-up frequency:');
    frequencyGroups.other_frequency.forEach(card => {
      console.log(`  ${card.id}. ${card.name}: ${card.wake_up_frequency}`);
    });
  }

} catch (error) {
  log.error('Error analyzing cards:', error);
} finally {
  // Close the database connection
  db.close();
}
