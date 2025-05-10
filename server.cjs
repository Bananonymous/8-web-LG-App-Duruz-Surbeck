const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'loup_garous_secret_key'; // En production, utilisez une variable d'environnement

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à la base de données
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
      is_custom BOOLEAN DEFAULT 0
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
        is_custom: 0
      },
      {
        name: 'Villageois',
        team: 'Village',
        description: 'Les Villageois doivent éliminer tous les Loups-Garous.',
        lore: 'Simples habitants du village, ils doivent faire preuve de perspicacité pour démasquer les Loups-Garous.',
        image_url: '/images/villageois.png',
        is_custom: 0
      },
      {
        name: 'Voyante',
        team: 'Village',
        description: 'Chaque nuit, la Voyante peut découvrir l\'identité d\'un joueur.',
        lore: 'Dotée de pouvoirs de divination, elle aide le village à identifier les Loups-Garous.',
        image_url: '/images/voyante.png',
        is_custom: 0
      },
      {
        name: 'Sorcière',
        team: 'Village',
        description: 'La Sorcière dispose de deux potions : une pour guérir, une pour tuer.',
        lore: 'Experte en potions, elle peut sauver une victime des Loups-Garous ou éliminer un joueur de son choix.',
        image_url: '/images/sorciere.png',
        is_custom: 0
      },
      {
        name: 'Chasseur',
        team: 'Village',
        description: 'Quand le Chasseur meurt, il doit immédiatement éliminer un autre joueur.',
        lore: 'Même dans la mort, le Chasseur ne part pas sans emporter quelqu\'un avec lui.',
        image_url: '/images/chasseur.png',
        is_custom: 0
      },
      {
        name: 'Cupidon',
        team: 'Village',
        description: 'Au début du jeu, Cupidon désigne deux joueurs qui seront amoureux.',
        lore: 'Ses flèches créent un lien indéfectible : si l\'un des amoureux meurt, l\'autre meurt de chagrin.',
        image_url: '/images/cupidon.png',
        is_custom: 0
      },
      {
        name: 'Petite Fille',
        team: 'Village',
        description: 'La Petite Fille peut espionner les Loups-Garous pendant leur tour.',
        lore: 'Curieuse et intrépide, elle risque sa vie pour obtenir des informations précieuses.',
        image_url: '/images/petite-fille.png',
        is_custom: 0
      },
      {
        name: 'Voleur',
        team: 'Village',
        description: 'Au début de la partie, le Voleur peut échanger sa carte avec une carte non distribuée.',
        lore: 'Opportuniste, il peut changer de rôle au début de la partie selon ce qui l\'arrange.',
        image_url: '/images/voleur.png',
        is_custom: 0
      },
      {
        name: 'Loup-Garou Blanc',
        team: 'Solitaire',
        description: 'Le Loup-Garou Blanc est avec les Loups-Garous, mais doit gagner seul en éliminant tout le monde.',
        lore: 'Solitaire et traître, il joue un double jeu pour être le dernier survivant.',
        image_url: '/images/loup-garou-blanc.png',
        is_custom: 0
      },
      {
        name: 'Joueur de Flûte',
        team: 'Solitaire',
        description: 'Chaque nuit, le Joueur de Flûte peut charmer 2 joueurs qui le suivront.',
        lore: 'Son objectif est de charmer tous les joueurs encore en vie pour gagner la partie.',
        image_url: '/images/joueur-de-flute.png',
        is_custom: 0
      }
    ];

    const insertCard = db.prepare('INSERT INTO cards (name, team, description, lore, image_url, is_custom) VALUES (?, ?, ?, ?, ?, ?)');
    for (const card of defaultCards) {
      insertCard.run(card.name, card.team, card.description, card.lore, card.image_url, card.is_custom);
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
  const { name, team, description, lore, image_url, is_custom } = req.body;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('INSERT INTO cards (name, team, description, lore, image_url, is_custom) VALUES (?, ?, ?, ?, ?, ?)').run(name, team, description, lore, image_url, is_custom ? 1 : 0);
    res.status(201).json({ id: result.lastInsertRowid, name, team, description, lore, image_url, is_custom });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la carte', error: error.message });
  }
});

app.put('/api/cards/:id', authenticateToken, (req, res) => {
  const { name, team, description, lore, image_url, is_custom } = req.body;
  const { id } = req.params;

  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    const result = db.prepare('UPDATE cards SET name = ?, team = ?, description = ?, lore = ?, image_url = ?, is_custom = ? WHERE id = ?').run(name, team, description, lore, image_url, is_custom ? 1 : 0, id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Carte non trouvée' });
    }

    res.json({ id, name, team, description, lore, image_url, is_custom });
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

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
