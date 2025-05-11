const Database = require('better-sqlite3');
const path = require('path');
const http = require('http');

// Path to the database file
const dbPath = path.join(__dirname, 'database.sqlite');

// Create a new database connection
console.log('Opening database...');
const db = new Database(dbPath);

// Get cards directly from the database
const dbCards = db.prepare('SELECT * FROM cards ORDER BY id ASC').all();
console.log(`Found ${dbCards.length} cards in the database`);
console.log('First few card IDs from database:', dbCards.slice(0, 5).map(c => c.id));

// Close the database connection
db.close();

// Now get cards from the API
console.log('\nFetching cards from API...');
http.get('http://localhost:5000/api/cards', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const apiCards = JSON.parse(data);
      console.log(`Found ${apiCards.length} cards from API`);
      console.log('First few card IDs from API:', apiCards.slice(0, 5).map(c => c.id));
      
      // Compare the two sets of cards
      if (dbCards.length === apiCards.length) {
        console.log('\nSame number of cards in database and API');
      } else {
        console.log('\nDifferent number of cards in database and API');
      }
      
      // Check if the IDs match
      const dbIds = dbCards.map(c => c.id);
      const apiIds = apiCards.map(c => c.id);
      
      const mismatchedIds = dbIds.filter((id, index) => id !== apiIds[index]);
      if (mismatchedIds.length > 0) {
        console.log(`Found ${mismatchedIds.length} mismatched IDs`);
        console.log('First few mismatched IDs (database vs API):');
        for (let i = 0; i < Math.min(5, mismatchedIds.length); i++) {
          const index = dbIds.indexOf(mismatchedIds[i]);
          console.log(`  ${dbIds[index]} vs ${apiIds[index]}`);
        }
      } else {
        console.log('All IDs match between database and API');
      }
    } catch (error) {
      console.error('Error parsing API response:', error);
    }
  });
}).on('error', (error) => {
  console.error('Error fetching cards from API:', error);
});
