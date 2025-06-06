// Import dotenv for environment variable support
try {
  require('dotenv').config();
} catch (err) {
  console.log('dotenv not installed, using default environment variables');
}

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Simple logging utility
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
  success: (msg) => console.log(`[SUCCESS] ${msg}`)
};

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_jwt';

if (JWT_SECRET === 'votre_clé_secrète_jwt') {
  console.warn('Using default JWT_SECRET. Set JWT_SECRET environment variable for production use.');
}

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

if (ADMIN_USERNAME === 'admin' && ADMIN_PASSWORD === 'admin123') {
  console.warn('Using default admin credentials. Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables for production use.');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connexion à la base de données SQLite
const db = new Database(path.join(__dirname, 'database.sqlite'), { verbose: console.log });

// Initialize database tables
try {
  // Read and execute SQL initialization file
  const fs = require('fs');
  const sqlFile = fs.readFileSync(path.join(__dirname, 'db-init.sql'), 'utf8');
  db.exec(sqlFile);

  // Create admin user if it doesn't exist
  const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get(ADMIN_USERNAME);
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)').run(ADMIN_USERNAME, hashedPassword, 1);
    logger.info(`Admin user created successfully with username: ${ADMIN_USERNAME}`);
  } else {
    logger.info(`Admin user already exists with username: ${ADMIN_USERNAME}`);
  }

  logger.info('Database initialized successfully');
} catch (error) {
  logger.error('Database initialization failed:', error);
}

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
    const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedPassword, ADMIN_USERNAME);

    // Créer l'admin s'il n'existe pas
    const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get(ADMIN_USERNAME);
    if (!adminExists) {
      db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)').run(ADMIN_USERNAME, hashedPassword, 1);
    }

    res.status(200).json({ message: `Mot de passe admin réinitialisé avec succès. Utilisez ${ADMIN_USERNAME}/${ADMIN_PASSWORD} pour vous connecter.` });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe admin:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe admin', error: error.message });
  }
});

// Routes pour les cartes
app.get('/api/cards', (req, res) => {
  try {
    // Get cards directly from database
    const cards = db.prepare('SELECT * FROM cards ORDER BY id ASC').all();

    // Convert SQLite integer values to booleans for API response
    const formattedCards = cards.map(card => ({
      ...card,
      is_custom: Boolean(card.is_custom),
      wakes_up_at_night: Boolean(card.wakes_up_at_night),
      wakes_up_every_night: Boolean(card.wakes_up_every_night)
    }));

    res.json(formattedCards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ message: 'Error fetching cards', error: error.message });
  }
});

// Route pour obtenir une carte par ID
app.get('/api/cards/:id', (req, res) => {
  try {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Convert SQLite integer values to booleans for API response
    const formattedCard = {
      ...card,
      is_custom: Boolean(card.is_custom),
      wakes_up_at_night: Boolean(card.wakes_up_at_night),
      wakes_up_every_night: Boolean(card.wakes_up_every_night)
    };

    res.json(formattedCard);
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ message: 'Error fetching card', error: error.message });
  }
});

// Route pour ajouter une nouvelle carte
app.post('/api/cards', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent ajouter des cartes.' });
    }

    const { name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency } = req.body;

    // Validation de base
    if (!name || !team || !description) {
      return res.status(400).json({ message: 'Les champs name, team et description sont obligatoires' });
    }

    const result = db.prepare('INSERT INTO cards (name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      name,
      team,
      description,
      lore || null,
      image_url || null,
      is_custom ? 1 : 0,
      wakes_up_at_night ? 1 : 0,
      wakes_up_every_night ? 1 : 0,
      wake_up_frequency || null
    );

    const newCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);

    // Convert SQLite integer values to booleans for API response
    const formattedCard = {
      ...newCard,
      is_custom: Boolean(newCard.is_custom),
      wakes_up_at_night: Boolean(newCard.wakes_up_at_night),
      wakes_up_every_night: Boolean(newCard.wakes_up_every_night)
    };

    res.status(201).json(formattedCard);
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({ message: 'Error adding card', error: error.message });
  }
});

// Route pour mettre à jour une carte
app.put('/api/cards/:id', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent modifier des cartes.' });
    }

    const { name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency } = req.body;

    // Validation de base
    if (!name || !team || !description) {
      return res.status(400).json({ message: 'Les champs name, team et description sont obligatoires' });
    }

    // Vérifier si la carte existe
    const existingCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!existingCard) {
      return res.status(404).json({ message: 'Carte non trouvée' });
    }

    db.prepare('UPDATE cards SET name = ?, team = ?, description = ?, lore = ?, image_url = ?, is_custom = ?, wakes_up_at_night = ?, wakes_up_every_night = ?, wake_up_frequency = ? WHERE id = ?').run(
      name,
      team,
      description,
      lore || null,
      image_url || null,
      is_custom ? 1 : 0,
      wakes_up_at_night ? 1 : 0,
      wakes_up_every_night ? 1 : 0,
      wake_up_frequency || null,
      req.params.id
    );

    const updatedCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);

    // Convert SQLite integer values to booleans for API response
    const formattedCard = {
      ...updatedCard,
      is_custom: Boolean(updatedCard.is_custom),
      wakes_up_at_night: Boolean(updatedCard.wakes_up_at_night),
      wakes_up_every_night: Boolean(updatedCard.wakes_up_every_night)
    };

    res.json(formattedCard);
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ message: 'Error updating card', error: error.message });
  }
});

// Route pour supprimer une carte
app.delete('/api/cards/:id', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent supprimer des cartes.' });
    }

    // Vérifier si la carte existe
    const existingCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!existingCard) {
      return res.status(404).json({ message: 'Carte non trouvée' });
    }

    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);

    res.json({ message: 'Carte supprimée avec succès', deletedCard: existingCard });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ message: 'Error deleting card', error: error.message });
  }
});

// Events routes removed in favor of Google Calendar integration

// Google Calendar proxy endpoint (optional)
app.get('/api/calendar/events', (req, res) => {
  try {
    // This endpoint can be used to proxy Google Calendar requests
    // if you need server-side API key management
    const mockEvents = [
      {
        id: 'server-mock-1',
        summary: 'Partie de Loups-Garous - Débutants',
        description: 'Une partie spécialement conçue pour les nouveaux joueurs. Venez découvrir l\'univers mystérieux de Thiercelieux !',
        location: 'Café des Jeux, Rue du Village 12, Lausanne',
        start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
        end: { dateTime: new Date(Date.now() + 86400000 + 7200000).toISOString() },
        htmlLink: 'https://calendar.google.com/calendar/event?eid=servermock1',
        creator: { displayName: 'Association Loups-Garous Lausanne' },
        status: 'confirmed'
      },
      {
        id: 'server-mock-2',
        summary: 'Tournoi de Loups-Garous - Édition Printemps',
        description: 'Grand tournoi mensuel avec prix à gagner ! Venez défendre votre village contre les créatures de la nuit.',
        location: 'Centre Culturel, Salle Polyvalente, Lausanne',
        start: { dateTime: new Date(Date.now() + 259200000).toISOString() },
        end: { dateTime: new Date(Date.now() + 259200000 + 14400000).toISOString() },
        htmlLink: 'https://calendar.google.com/calendar/event?eid=servermock2',
        creator: { displayName: 'Fédération Suisse de Loups-Garous' },
        status: 'confirmed'
      }
    ];

    res.json({ events: mockEvents });
  } catch (error) {
    logger.error('Error fetching calendar events:', error);
    res.status(500).json({ message: 'Error fetching calendar events', error: error.message });
  }
});

// Routes pour les variantes
app.get('/api/variants', (req, res) => {
  const variants = db.prepare('SELECT * FROM variants').all();
  res.json(variants);
});

app.get('/api/variants/:id', (req, res) => {
  try {
    const variant = db.prepare('SELECT * FROM variants WHERE id = ?').get(req.params.id);

    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    // Get variant cards
    const variantCards = db.prepare('SELECT * FROM variant_cards WHERE variant_id = ?').all(variant.id);

    // Convert SQLite integer values to booleans for API response
    const formattedVariantCards = variantCards.map(card => ({
      ...card,
      wakes_up_at_night: Boolean(card.wakes_up_at_night),
      wakes_up_every_night: Boolean(card.wakes_up_every_night)
    }));

    res.json({
      ...variant,
      cards: formattedVariantCards
    });
  } catch (error) {
    console.error('Error fetching variant:', error);
    res.status(500).json({ message: 'Error fetching variant', error: error.message });
  }
});

app.post('/api/variants', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent ajouter des variantes.' });
    }

    const { name, description, lore, image_url } = req.body;

    // Validation de base
    if (!name || !description) {
      return res.status(400).json({ message: 'Les champs name et description sont obligatoires' });
    }

    const result = db.prepare('INSERT INTO variants (name, description, lore, image_url) VALUES (?, ?, ?, ?)').run(
      name,
      description,
      lore || null,
      image_url || null
    );

    const newVariant = db.prepare('SELECT * FROM variants WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(newVariant);
  } catch (error) {
    console.error('Error adding variant:', error);
    res.status(500).json({ message: 'Error adding variant', error: error.message });
  }
});

app.put('/api/variants/:id', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent modifier des variantes.' });
    }

    const { name, description, lore, image_url } = req.body;

    // Validation de base
    if (!name || !description) {
      return res.status(400).json({ message: 'Les champs name et description sont obligatoires' });
    }

    // Vérifier si la variante existe
    const existingVariant = db.prepare('SELECT * FROM variants WHERE id = ?').get(req.params.id);
    if (!existingVariant) {
      return res.status(404).json({ message: 'Variante non trouvée' });
    }

    db.prepare('UPDATE variants SET name = ?, description = ?, lore = ?, image_url = ? WHERE id = ?').run(
      name,
      description,
      lore || null,
      image_url || null,
      req.params.id
    );

    const updatedVariant = db.prepare('SELECT * FROM variants WHERE id = ?').get(req.params.id);

    res.json(updatedVariant);
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ message: 'Error updating variant', error: error.message });
  }
});

app.delete('/api/variants/:id', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent supprimer des variantes.' });
    }

    // Vérifier si la variante existe
    const existingVariant = db.prepare('SELECT * FROM variants WHERE id = ?').get(req.params.id);
    if (!existingVariant) {
      return res.status(404).json({ message: 'Variante non trouvée' });
    }

    // Supprimer les cartes de la variante
    db.prepare('DELETE FROM variant_cards WHERE variant_id = ?').run(req.params.id);

    // Supprimer la variante
    db.prepare('DELETE FROM variants WHERE id = ?').run(req.params.id);

    res.json({ message: 'Variante supprimée avec succès', deletedVariant: existingVariant });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ message: 'Error deleting variant', error: error.message });
  }
});

// Routes pour les cartes de variante
app.get('/api/variant-cards', (req, res) => {
  try {
    let variantCards;
    const { variant_id } = req.query;

    if (variant_id) {
      // Filter by variant_id if provided
      variantCards = db.prepare('SELECT * FROM variant_cards WHERE variant_id = ?').all(variant_id);
    } else {
      // Return all variant cards if no filter provided
      variantCards = db.prepare('SELECT * FROM variant_cards').all();
    }

    // Convert SQLite integer values to booleans for API response
    const formattedVariantCards = variantCards.map(card => ({
      ...card,
      wakes_up_at_night: Boolean(card.wakes_up_at_night),
      wakes_up_every_night: Boolean(card.wakes_up_every_night)
    }));

    res.json(formattedVariantCards);
  } catch (error) {
    console.error('Error fetching variant cards:', error);
    res.status(500).json({ message: 'Error fetching variant cards', error: error.message });
  }
});

app.get('/api/variant-cards/:id', (req, res) => {
  try {
    const variantCard = db.prepare('SELECT * FROM variant_cards WHERE id = ?').get(req.params.id);

    if (!variantCard) {
      return res.status(404).json({ message: 'Variant card not found' });
    }

    // Convert SQLite integer values to booleans for API response
    const formattedVariantCard = {
      ...variantCard,
      wakes_up_at_night: Boolean(variantCard.wakes_up_at_night),
      wakes_up_every_night: Boolean(variantCard.wakes_up_every_night)
    };

    res.json(formattedVariantCard);
  } catch (error) {
    console.error('Error fetching variant card:', error);
    res.status(500).json({ message: 'Error fetching variant card', error: error.message });
  }
});

app.post('/api/variant-cards', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent ajouter des cartes de variante.' });
    }

    const { variant_id, name, team, description, lore, image_url, wakes_up_at_night, wakes_up_every_night, wake_up_frequency } = req.body;

    // Validation de base
    if (!variant_id || !name || !team || !description) {
      return res.status(400).json({ message: 'Les champs variant_id, name, team et description sont obligatoires' });
    }

    // Vérifier si la variante existe
    const existingVariant = db.prepare('SELECT * FROM variants WHERE id = ?').get(variant_id);
    if (!existingVariant) {
      return res.status(404).json({ message: 'Variante non trouvée' });
    }

    const result = db.prepare('INSERT INTO variant_cards (variant_id, name, team, description, lore, image_url, wakes_up_at_night, wakes_up_every_night, wake_up_frequency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      variant_id,
      name,
      team,
      description,
      lore || null,
      image_url || null,
      wakes_up_at_night ? 1 : 0,
      wakes_up_every_night ? 1 : 0,
      wake_up_frequency || null
    );

    const newVariantCard = db.prepare('SELECT * FROM variant_cards WHERE id = ?').get(result.lastInsertRowid);

    // Convert SQLite integer values to booleans for API response
    const formattedVariantCard = {
      ...newVariantCard,
      wakes_up_at_night: Boolean(newVariantCard.wakes_up_at_night),
      wakes_up_every_night: Boolean(newVariantCard.wakes_up_every_night)
    };

    res.status(201).json(formattedVariantCard);
  } catch (error) {
    console.error('Error adding variant card:', error);
    res.status(500).json({ message: 'Error adding variant card', error: error.message });
  }
});

app.put('/api/variant-cards/:id', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent modifier des cartes de variante.' });
    }

    const { variant_id, name, team, description, lore, image_url, wakes_up_at_night, wakes_up_every_night, wake_up_frequency } = req.body;

    // Validation de base
    if (!variant_id || !name || !team || !description) {
      return res.status(400).json({ message: 'Les champs variant_id, name, team et description sont obligatoires' });
    }

    // Vérifier si la carte de variante existe
    const existingVariantCard = db.prepare('SELECT * FROM variant_cards WHERE id = ?').get(req.params.id);
    if (!existingVariantCard) {
      return res.status(404).json({ message: 'Carte de variante non trouvée' });
    }

    // Vérifier si la variante existe
    const existingVariant = db.prepare('SELECT * FROM variants WHERE id = ?').get(variant_id);
    if (!existingVariant) {
      return res.status(404).json({ message: 'Variante non trouvée' });
    }

    db.prepare('UPDATE variant_cards SET variant_id = ?, name = ?, team = ?, description = ?, lore = ?, image_url = ?, wakes_up_at_night = ?, wakes_up_every_night = ?, wake_up_frequency = ? WHERE id = ?').run(
      variant_id,
      name,
      team,
      description,
      lore || null,
      image_url || null,
      wakes_up_at_night ? 1 : 0,
      wakes_up_every_night ? 1 : 0,
      wake_up_frequency || null,
      req.params.id
    );

    const updatedVariantCard = db.prepare('SELECT * FROM variant_cards WHERE id = ?').get(req.params.id);

    // Convert SQLite integer values to booleans for API response
    const formattedVariantCard = {
      ...updatedVariantCard,
      wakes_up_at_night: Boolean(updatedVariantCard.wakes_up_at_night),
      wakes_up_every_night: Boolean(updatedVariantCard.wakes_up_every_night)
    };

    res.json(formattedVariantCard);
  } catch (error) {
    console.error('Error updating variant card:', error);
    res.status(500).json({ message: 'Error updating variant card', error: error.message });
  }
});

app.delete('/api/variant-cards/:id', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent supprimer des cartes de variante.' });
    }

    // Vérifier si la carte de variante existe
    const existingVariantCard = db.prepare('SELECT * FROM variant_cards WHERE id = ?').get(req.params.id);
    if (!existingVariantCard) {
      return res.status(404).json({ message: 'Carte de variante non trouvée' });
    }

    db.prepare('DELETE FROM variant_cards WHERE id = ?').run(req.params.id);

    res.json({ message: 'Carte de variante supprimée avec succès', deletedVariantCard: existingVariantCard });
  } catch (error) {
    console.error('Error deleting variant card:', error);
    res.status(500).json({ message: 'Error deleting variant card', error: error.message });
  }
});

// Routes pour l'ordre de réveil
app.get('/api/wake-up-order', (req, res) => {
  try {
    const wakeUpOrders = db.prepare('SELECT * FROM wake_up_order').all();
    res.json(wakeUpOrders);
  } catch (error) {
    console.error('Error fetching wake-up orders:', error);
    res.status(500).json({ message: 'Error fetching wake-up orders', error: error.message });
  }
});

app.get('/api/wake-up-order/:variant_id', (req, res) => {
  try {
    console.log(`Fetching wake-up order for variant: ${req.params.variant_id}, includeBase: ${req.query.includeBase}`);

    const wakeUpOrder = db.prepare('SELECT * FROM wake_up_order WHERE variant_id = ?').get(req.params.variant_id);

    if (!wakeUpOrder) {
      console.log(`No wake-up order found for variant: ${req.params.variant_id}`);
      return res.status(404).json({ message: 'Wake-up order not found for this variant' });
    }

    // Parse the order_data JSON string
    try {
      wakeUpOrder.order_data = JSON.parse(wakeUpOrder.order_data);
      console.log(`Successfully parsed order_data for variant: ${req.params.variant_id}`);

      // For backward compatibility, also provide the data as 'order'
      wakeUpOrder.order = wakeUpOrder.order_data;

      res.json(wakeUpOrder);
    } catch (parseError) {
      console.error(`Error parsing order_data for variant ${req.params.variant_id}:`, parseError);
      res.status(500).json({ message: 'Error parsing wake-up order data', error: parseError.message });
    }
  } catch (error) {
    console.error('Error fetching wake-up order:', error);
    res.status(500).json({ message: 'Error fetching wake-up order', error: error.message });
  }
});

app.post('/api/wake-up-order', authenticateToken, (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent ajouter des ordres de réveil.' });
    }

    const { variant_id, include_base, order_data } = req.body;

    // Validation de base
    if (!variant_id || order_data === undefined) {
      return res.status(400).json({ message: 'Les champs variant_id et order_data sont obligatoires' });
    }

    // Vérifier si un ordre de réveil existe déjà pour cette variante
    const existingOrder = db.prepare('SELECT * FROM wake_up_order WHERE variant_id = ?').get(variant_id);

    if (existingOrder) {
      // Mettre à jour l'ordre existant
      db.prepare('UPDATE wake_up_order SET include_base = ?, order_data = ? WHERE variant_id = ?').run(
        include_base ? 1 : 0,
        JSON.stringify(order_data),
        variant_id
      );

      const updatedOrder = db.prepare('SELECT * FROM wake_up_order WHERE variant_id = ?').get(variant_id);
      updatedOrder.order_data = JSON.parse(updatedOrder.order_data);

      return res.json(updatedOrder);
    }

    // Créer un nouvel ordre
    const result = db.prepare('INSERT INTO wake_up_order (variant_id, include_base, order_data) VALUES (?, ?, ?)').run(
      variant_id,
      include_base ? 1 : 0,
      JSON.stringify(order_data)
    );

    const newOrder = db.prepare('SELECT * FROM wake_up_order WHERE id = ?').get(result.lastInsertRowid);
    newOrder.order_data = JSON.parse(newOrder.order_data);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error adding wake-up order:', error);
    res.status(500).json({ message: 'Error adding wake-up order', error: error.message });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve the React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);
});
