const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'votre_clé_secrète_jwt';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connexion à la base de données SQLite
const db = new Database(path.join(__dirname, 'database.sqlite'), { verbose: console.log });

// Initialisation de la base de données
function initializeDatabase() {
  // Read the SQL from the db-init.sql file
  const fs = require('fs');
  const path = require('path');
  const dbInitSql = fs.readFileSync(path.join(__dirname, 'db-init.sql'), 'utf8');

  // Execute the SQL statements
  db.exec(dbInitSql);

  console.log('Database initialized from db-init.sql');
}

// Initialiser la base de données
initializeDatabase();

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authentification requise' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide ou expiré' });
    req.user = user;
    next();
  });
};

// Routes pour l'authentification
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '24h' });

  res.json({ token, user: { id: user.id, username: user.username, is_admin: user.is_admin } });
});

// Route pour vérifier la validité du token
app.get('/api/verify-token', authenticateToken, (req, res) => {
  // Si le middleware authenticateToken a passé, le token est valide
  res.json({ valid: true, user: req.user });
});

// Route pour réinitialiser le mot de passe admin
app.post('/api/reset-admin', (req, res) => {
  try {
    // Réinitialiser le mot de passe de l'admin
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedPassword, 'admin');

    // Créer l'admin s'il n'existe pas
    const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!adminExists) {
      db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)').run('admin', hashedPassword, 1);
    }

    res.status(200).json({ message: 'Mot de passe admin réinitialisé avec succès. Utilisez admin/admin123 pour vous connecter.' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe admin:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe admin', error: error.message });
  }
});

// Routes pour les cartes
app.get('/api/cards', (req, res) => {
  // Check the current sequence value for cards
  const sequence = db.prepare("SELECT * FROM sqlite_sequence WHERE name = 'cards'").get();
  console.log('Current sequence for cards table:', sequence);

  // Get all cards from the database, removing duplicates by name
  const allCards = db.prepare('SELECT * FROM cards ORDER BY id ASC').all();
  console.log('Fetching cards from database, count:', allCards.length);

  // Create a map to store unique cards by name
  const uniqueCardsMap = new Map();

  // Keep only the first occurrence of each card name
  allCards.forEach(card => {
    if (!uniqueCardsMap.has(card.name)) {
      uniqueCardsMap.set(card.name, card);
    }
  });

  // Convert the map back to an array
  const uniqueCards = Array.from(uniqueCardsMap.values());

  console.log('Unique cards count:', uniqueCards.length);
  console.log('First few card IDs:', uniqueCards.slice(0, 5).map(c => c.id));

  res.json(uniqueCards);
});

// Route pour réinitialiser et repeupler la table des cartes
app.post('/api/reset-cards', authenticateToken, (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    // Close the current database connection
    db.close();

    // Delete the database file
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, 'database.sqlite');

    // Check if the file exists before attempting to delete
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Database file deleted successfully');
    }

    // Reconnect to the database (this will create a new empty database)
    db = new Database(path.join(__dirname, 'database.sqlite'), { verbose: console.log });

    // Read the SQL from the db-init.sql file
    const dbInitSql = fs.readFileSync(path.join(__dirname, 'db-init.sql'), 'utf8');

    // Execute the SQL statements to recreate the database
    db.exec(dbInitSql);

    // Count the number of cards inserted
    const cardsCount = db.prepare('SELECT COUNT(*) as count FROM cards').get().count;

    res.status(200).json({
      message: 'Base de données réinitialisée avec succès à partir du fichier db-init.sql.',
      count: cardsCount
    });
  } catch (error) {
    console.error('Error during database reset:', error);
    res.status(500).json({
      message: 'Erreur lors de la réinitialisation de la base de données',
      error: error.message
    });

    // If there was an error, try to reconnect to the database
    try {
      if (!db || db.open === false) {
        db = new Database(path.join(__dirname, 'database.sqlite'), { verbose: console.log });
        console.log('Reconnected to database after error');
      }
    } catch (reconnectError) {
      console.error('Failed to reconnect to database:', reconnectError);
    }
  }
});

app.get('/api/cards/:id', (req, res) => {
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);

  if (!card) {
    return res.status(404).json({ message: 'Carte non trouvée' });
  }

  res.json(card);
});

app.post('/api/cards', authenticateToken, (req, res) => {
  const { name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency } = req.body;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('INSERT INTO cards (name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      name,
      team,
      description,
      lore,
      image_url,
      is_custom ? 1 : 0,
      wakes_up_at_night ? 1 : 0,
      wakes_up_every_night ? 1 : 0,
      wake_up_frequency
    );
    res.status(201).json({
      id: result.lastInsertRowid,
      name,
      team,
      description,
      lore,
      image_url,
      is_custom,
      wakes_up_at_night,
      wakes_up_every_night,
      wake_up_frequency
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la carte', error: error.message });
  }
});

app.put('/api/cards/:id', authenticateToken, (req, res) => {
  const { name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency } = req.body;
  const { id } = req.params;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('UPDATE cards SET name = ?, team = ?, description = ?, lore = ?, image_url = ?, is_custom = ?, wakes_up_at_night = ?, wakes_up_every_night = ?, wake_up_frequency = ? WHERE id = ?').run(
      name,
      team,
      description,
      lore,
      image_url,
      is_custom ? 1 : 0,
      wakes_up_at_night ? 1 : 0,
      wakes_up_every_night ? 1 : 0,
      wake_up_frequency,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Carte non trouvée' });
    }

    res.json({
      id,
      name,
      team,
      description,
      lore,
      image_url,
      is_custom,
      wakes_up_at_night,
      wakes_up_every_night,
      wake_up_frequency
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la carte', error: error.message });
  }
});

app.delete('/api/cards/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('DELETE FROM cards WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Carte non trouvée' });
    }

    res.json({ message: 'Carte supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la carte', error: error.message });
  }
});

// Routes pour les événements du calendrier
app.get('/api/events', (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY date').all();
  res.json(events);
});

app.post('/api/events', authenticateToken, (req, res) => {
  const { title, date, description, location } = req.body;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('INSERT INTO events (title, date, description, location) VALUES (?, ?, ?, ?)').run(title, date, description, location);
    res.status(201).json({ id: result.lastInsertRowid, title, date, description, location });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'événement', error: error.message });
  }
});

app.put('/api/events/:id', authenticateToken, (req, res) => {
  const { title, date, description, location } = req.body;
  const { id } = req.params;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('UPDATE events SET title = ?, date = ?, description = ?, location = ? WHERE id = ?').run(title, date, description, location, id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    res.json({ id, title, date, description, location });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'événement', error: error.message });
  }
});

app.delete('/api/events/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement', error: error.message });
  }
});

// Routes pour les variantes
app.get('/api/variants', (req, res) => {
  const variants = db.prepare('SELECT * FROM variants').all();
  res.json(variants);
});

app.get('/api/variants/:id', (req, res) => {
  const variant = db.prepare('SELECT * FROM variants WHERE id = ?').get(req.params.id);

  if (!variant) {
    return res.status(404).json({ message: 'Variante non trouvée' });
  }

  res.json(variant);
});

app.post('/api/variants', authenticateToken, (req, res) => {
  const { name, description, lore, image_url } = req.body;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('INSERT INTO variants (name, description, lore, image_url) VALUES (?, ?, ?, ?)').run(name, description, lore, image_url);
    res.status(201).json({ id: result.lastInsertRowid, name, description, lore, image_url });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la variante', error: error.message });
  }
});

app.put('/api/variants/:id', authenticateToken, (req, res) => {
  const { name, description, lore, image_url } = req.body;
  const { id } = req.params;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('UPDATE variants SET name = ?, description = ?, lore = ?, image_url = ? WHERE id = ?').run(name, description, lore, image_url, id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Variante non trouvée' });
    }

    res.json({ id, name, description, lore, image_url });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la variante', error: error.message });
  }
});

app.delete('/api/variants/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('DELETE FROM variants WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Variante non trouvée' });
    }

    res.json({ message: 'Variante supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la variante', error: error.message });
  }
});

// Routes pour les cartes de variantes
app.get('/api/variant-cards', (req, res) => {
  const variantId = req.query.variant_id;

  let variantCards;
  if (variantId) {
    variantCards = db.prepare('SELECT * FROM variant_cards WHERE variant_id = ?').all(variantId);
  } else {
    variantCards = db.prepare('SELECT * FROM variant_cards').all();
  }

  res.json(variantCards);
});

app.get('/api/variant-cards/:id', (req, res) => {
  const variantCard = db.prepare('SELECT * FROM variant_cards WHERE id = ?').get(req.params.id);

  if (!variantCard) {
    return res.status(404).json({ message: 'Carte de variante non trouvée' });
  }

  res.json(variantCard);
});

app.post('/api/variant-cards', authenticateToken, (req, res) => {
  const { variant_id, name, team, description, lore, image_url, wakes_up_at_night, wakes_up_every_night, wake_up_frequency } = req.body;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('INSERT INTO variant_cards (variant_id, name, team, description, lore, image_url, wakes_up_at_night, wakes_up_every_night, wake_up_frequency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      variant_id,
      name,
      team,
      description,
      lore,
      image_url,
      wakes_up_at_night ? 1 : 0,
      wakes_up_every_night ? 1 : 0,
      wake_up_frequency
    );
    res.status(201).json({
      id: result.lastInsertRowid,
      variant_id,
      name,
      team,
      description,
      lore,
      image_url,
      wakes_up_at_night,
      wakes_up_every_night,
      wake_up_frequency
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la carte de variante', error: error.message });
  }
});

app.put('/api/variant-cards/:id', authenticateToken, (req, res) => {
  const { variant_id, name, team, description, lore, image_url, wakes_up_at_night, wakes_up_every_night, wake_up_frequency } = req.body;
  const { id } = req.params;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('UPDATE variant_cards SET variant_id = ?, name = ?, team = ?, description = ?, lore = ?, image_url = ?, wakes_up_at_night = ?, wakes_up_every_night = ?, wake_up_frequency = ? WHERE id = ?').run(
      variant_id,
      name,
      team,
      description,
      lore,
      image_url,
      wakes_up_at_night ? 1 : 0,
      wakes_up_every_night ? 1 : 0,
      wake_up_frequency,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Carte de variante non trouvée' });
    }

    res.json({
      id,
      variant_id,
      name,
      team,
      description,
      lore,
      image_url,
      wakes_up_at_night,
      wakes_up_every_night,
      wake_up_frequency
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la carte de variante', error: error.message });
  }
});

app.delete('/api/variant-cards/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('DELETE FROM variant_cards WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Carte de variante non trouvée' });
    }

    res.json({ message: 'Carte de variante supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la carte de variante', error: error.message });
  }
});

// Routes pour l'ordre de réveil des rôles
app.get('/api/wake-up-order/:variantId', (req, res) => {
  const { variantId } = req.params;
  const includeBase = req.query.includeBase === 'true';

  console.log(`Fetching wake-up order for variant: ${variantId}, includeBase: ${includeBase}`);

  try {
    // Rechercher l'ordre de réveil pour cette variante et cette configuration
    const wakeUpOrder = db.prepare('SELECT * FROM wake_up_order WHERE variant_id = ? AND include_base = ?').get(
      variantId,
      includeBase ? 1 : 0
    );

    if (wakeUpOrder) {
      // Convertir la chaîne JSON en objet
      const orderData = JSON.parse(wakeUpOrder.order_data);
      console.log('Found wake-up order:', orderData);

      // Sort the order data by the order field
      const sortedOrderData = [...orderData].sort((a, b) => a.order - b.order);
      console.log('Sorted wake-up order:', sortedOrderData);

      res.json({ order: sortedOrderData });
    } else {
      // Aucun ordre trouvé
      console.log('No wake-up order found');
      res.json({ order: [] });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ordre de réveil:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'ordre de réveil', error: error.message });
  }
});

app.post('/api/wake-up-order', (req, res) => {
  const { variant_id, include_base, order } = req.body;

  try {
    // Validate the order data
    if (!Array.isArray(order)) {
      return res.status(400).json({ message: 'L\'ordre doit être un tableau' });
    }

    // Ensure we only store the essential data (id, name, order)
    const simplifiedOrder = order.map(item => ({
      id: item.id,
      name: item.name,
      order: item.order
    }));

    console.log('Saving wake-up order:', {
      variant_id,
      include_base: include_base ? 1 : 0,
      order: simplifiedOrder
    });

    // Vérifier si un ordre existe déjà pour cette variante et cette configuration
    const existingOrder = db.prepare('SELECT id FROM wake_up_order WHERE variant_id = ? AND include_base = ?').get(
      variant_id,
      include_base ? 1 : 0
    );

    if (existingOrder) {
      // Mettre à jour l'ordre existant
      db.prepare('UPDATE wake_up_order SET order_data = ? WHERE id = ?').run(
        JSON.stringify(simplifiedOrder),
        existingOrder.id
      );
      console.log(`Updated wake-up order with ID ${existingOrder.id}`);
    } else {
      // Créer un nouvel ordre
      const result = db.prepare('INSERT INTO wake_up_order (variant_id, include_base, order_data) VALUES (?, ?, ?)').run(
        variant_id,
        include_base ? 1 : 0,
        JSON.stringify(simplifiedOrder)
      );
      console.log(`Created new wake-up order with ID ${result.lastInsertRowid}`);
    }

    res.json({ message: 'Ordre de réveil sauvegardé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'ordre de réveil:', error);
    res.status(500).json({ message: 'Erreur lors de la sauvegarde de l\'ordre de réveil', error: error.message });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
