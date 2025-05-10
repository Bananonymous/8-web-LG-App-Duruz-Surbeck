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
  // Création de la table des cartes
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      description TEXT NOT NULL,
      lore TEXT,
      image_url TEXT,
      is_custom BOOLEAN DEFAULT 0,
      wakes_up_at_night BOOLEAN DEFAULT 0,
      wakes_up_every_night BOOLEAN DEFAULT 0,
      wake_up_frequency TEXT
    )
  `);

  // Création de la table des utilisateurs (admins)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0
    )
  `);

  // Création de la table des événements du calendrier
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      location TEXT
    )
  `);

  // Création de la table des variantes
  db.exec(`
    CREATE TABLE IF NOT EXISTS variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      lore TEXT,
      image_url TEXT
    )
  `);

  // Création de la table des cartes de variantes
  db.exec(`
    CREATE TABLE IF NOT EXISTS variant_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      description TEXT NOT NULL,
      lore TEXT,
      image_url TEXT,
      wakes_up_at_night BOOLEAN DEFAULT 0,
      wakes_up_every_night BOOLEAN DEFAULT 0,
      wake_up_frequency TEXT,
      FOREIGN KEY (variant_id) REFERENCES variants (id) ON DELETE CASCADE
    )
  `);

  // Vérifier si un admin existe déjà, sinon en créer un
  const adminExists = db.prepare('SELECT * FROM users WHERE is_admin = 1 LIMIT 1').get();
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)').run('admin', hashedPassword, 1);
    console.log('Admin utilisateur créé avec le nom d\'utilisateur: admin et le mot de passe: admin123');
  }

  // Ajouter quelques cartes par défaut si la table est vide
  const cardsCount = db.prepare('SELECT COUNT(*) as count FROM cards').get().count;
  if (cardsCount === 0) {
    const defaultCards = [
      {
        name: 'Loup-Garou',
        team: 'Loups-Garous',
        description: 'Chaque nuit, les Loups-Garous dévorent un Villageois.',
        lore: 'Créatures mythiques mi-homme mi-loup, ils se cachent parmi les villageois le jour et les dévorent la nuit.',
        image_url: '/images/loup-garou.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Villageois',
        team: 'Village',
        description: 'Les Villageois doivent éliminer tous les Loups-Garous.',
        lore: 'Simples habitants du village, ils doivent faire preuve de perspicacité pour démasquer les Loups-Garous.',
        image_url: '/images/villageois.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Voyante',
        team: 'Village',
        description: 'Chaque nuit, la Voyante peut découvrir l\'identité d\'un joueur.',
        lore: 'Dotée de pouvoirs de divination, elle aide le village à identifier les Loups-Garous.',
        image_url: '/images/voyante.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Sorcière',
        team: 'Village',
        description: 'La Sorcière dispose de deux potions : une pour guérir, une pour tuer.',
        lore: 'Experte en potions, elle peut sauver une victime des Loups-Garous ou éliminer un joueur de son choix.',
        image_url: '/images/sorciere.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Chasseur',
        team: 'Village',
        description: 'Quand le Chasseur meurt, il doit immédiatement éliminer un autre joueur.',
        lore: 'Même dans la mort, le Chasseur ne part pas sans emporter quelqu\'un avec lui.',
        image_url: '/images/chasseur.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Cupidon',
        team: 'Village',
        description: 'Au début du jeu, Cupidon désigne deux joueurs qui seront amoureux.',
        lore: 'Ses flèches créent un lien indéfectible : si l\'un des amoureux meurt, l\'autre meurt de chagrin.',
        image_url: '/images/cupidon.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "1rst night only"
      },
      {
        name: 'Petite Fille',
        team: 'Village',
        description: 'La Petite Fille peut espionner les Loups-Garous pendant leur tour.',
        lore: 'Curieuse et intrépide, elle risque sa vie pour obtenir des informations précieuses.',
        image_url: '/images/petite-fille.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Voleur',
        team: 'Village',
        description: 'Au début de la partie, le Voleur peut échanger sa carte avec une carte non distribuée.',
        lore: 'Opportuniste, il peut changer de rôle au début de la partie selon ce qui l\'arrange.',
        image_url: '/images/voleur.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "1rst night only"
      },
      {
        name: 'Loup-Garou Blanc',
        team: 'Solitaire',
        description: 'Le Loup-Garou Blanc est avec les Loups-Garous, mais doit gagner seul en éliminant tout le monde.',
        lore: 'Solitaire et traître, il joue un double jeu pour être le dernier survivant.',
        image_url: '/images/loup-garou-blanc.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "1/2 nights"
      },
      {
        name: 'Joueur de Flûte',
        team: 'Solitaire',
        description: 'Chaque nuit, le Joueur de Flûte peut charmer 2 joueurs qui le suivront.',
        lore: 'Son objectif est de charmer tous les joueurs encore en vie pour gagner la partie.',
        image_url: '/images/joueur-de-flute.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      }
    ];

    const insertCard = db.prepare('INSERT INTO cards (name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const card of defaultCards) {
      insertCard.run(
        card.name,
        card.team,
        card.description,
        card.lore,
        card.image_url,
        card.is_custom,
        card.wakes_up_at_night,
        card.wakes_up_every_night,
        card.wake_up_frequency
      );
    }
    console.log('Cartes par défaut ajoutées');
  }

  // Ajouter quelques événements par défaut si la table est vide
  const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  if (eventsCount === 0) {
    const defaultEvents = [
      {
        title: 'Soirée Loups-Garous',
        date: '2023-12-15',
        description: 'Venez jouer aux Loups-Garous de Thiercelieux !',
        location: 'Ludothèque de la ville'
      },
      {
        title: 'Tournoi Loups-Garous',
        date: '2024-01-20',
        description: 'Grand tournoi annuel de Loups-Garous',
        location: 'Salle des fêtes'
      }
    ];

    const insertEvent = db.prepare('INSERT INTO events (title, date, description, location) VALUES (?, ?, ?, ?)');
    for (const event of defaultEvents) {
      insertEvent.run(event.title, event.date, event.description, event.location);
    }
    console.log('Événements par défaut ajoutés');
  }

  // Ajouter quelques variantes par défaut si la table est vide
  const variantsCount = db.prepare('SELECT COUNT(*) as count FROM variants').get().count;
  if (variantsCount === 0) {
    const defaultVariants = [
      {
        name: 'Nouvelle Lune',
        description: 'Une variante qui introduit de nouveaux rôles et mécaniques de jeu.',
        lore: 'Sous la nouvelle lune, des pouvoirs mystérieux s\'éveillent et de nouvelles alliances se forment dans le village de Thiercelieux.',
        image_url: '/images/nouvelle-lune.svg'
      }
    ];

    const insertVariant = db.prepare('INSERT INTO variants (name, description, lore, image_url) VALUES (?, ?, ?, ?)');
    for (const variant of defaultVariants) {
      insertVariant.run(variant.name, variant.description, variant.lore, variant.image_url);
    }
    console.log('Variantes par défaut ajoutées');
  }

  // Ajouter quelques cartes de variante par défaut si la table est vide
  const variantCardsCount = db.prepare('SELECT COUNT(*) as count FROM variant_cards').get().count;
  if (variantCardsCount === 0) {
    // Récupérer l'ID de la variante "Nouvelle Lune"
    const nouvelleLune = db.prepare('SELECT id FROM variants WHERE name = ?').get('Nouvelle Lune');

    if (nouvelleLune) {
      const defaultVariantCards = [
        {
          variant_id: nouvelleLune.id,
          name: 'Chaman',
          team: 'Village',
          description: 'Le Chaman peut communiquer avec les morts une fois par nuit.',
          lore: 'Gardien des traditions ancestrales, il peut entrer en contact avec l\'au-delà pour guider les vivants.',
          image_url: '/images/chaman.svg',
          wakes_up_at_night: 1,
          wakes_up_every_night: 1,
          wake_up_frequency: null
        },
        {
          variant_id: nouvelleLune.id,
          name: 'Loup Alpha',
          team: 'Loups-Garous',
          description: 'Le Loup Alpha peut transformer un villageois en Loup-Garou une fois par partie.',
          lore: 'Chef de la meute, son hurlement peut réveiller la bête qui sommeille en chaque humain.',
          image_url: '/images/loup-alpha.svg',
          wakes_up_at_night: 1,
          wakes_up_every_night: 0,
          wake_up_frequency: "1/3 nights"
        }
      ];

      const insertVariantCard = db.prepare('INSERT INTO variant_cards (variant_id, name, team, description, lore, image_url, wakes_up_at_night, wakes_up_every_night, wake_up_frequency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const card of defaultVariantCards) {
        insertVariantCard.run(
          card.variant_id,
          card.name,
          card.team,
          card.description,
          card.lore,
          card.image_url,
          card.wakes_up_at_night,
          card.wakes_up_every_night,
          card.wake_up_frequency
        );
      }
      console.log('Cartes de variante par défaut ajoutées');
    }
  }
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

  const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token, user: { id: user.id, username: user.username, is_admin: user.is_admin } });
});

// Routes pour les cartes
app.get('/api/cards', (req, res) => {
  const cards = db.prepare('SELECT * FROM cards').all();
  res.json(cards);
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

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
