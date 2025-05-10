import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const db = new Database(path.join(__dirname, 'database.sqlite'), { verbose: console.log });

// Query to get all cards
const cards = db.prepare('SELECT id, name, team FROM cards ORDER BY team, name').all();

console.log('Total cards in database:', cards.length);
console.log('\nCards by team:');

// Group cards by team
const cardsByTeam = {};
cards.forEach(card => {
  if (!cardsByTeam[card.team]) {
    cardsByTeam[card.team] = [];
  }
  cardsByTeam[card.team].push(card);
});

// Print cards by team
for (const team in cardsByTeam) {
  console.log(`\n${team} (${cardsByTeam[team].length} cards):`);
  cardsByTeam[team].forEach(card => {
    console.log(`  ${card.id}. ${card.name}`);
  });
}

// Close the database connection
db.close();
