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

  // Création de la table pour l'ordre de réveil des rôles
  db.exec(`
    CREATE TABLE IF NOT EXISTS wake_up_order (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id TEXT NOT NULL,
      include_base BOOLEAN DEFAULT 1,
      order_data TEXT NOT NULL
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
      // Rôles de base
      {
        name: 'Loup-Garou',
        team: 'Loups-Garous',
        description: 'se réveille chaque nuit en meute pour faire une victime',
        lore: 'Créatures mythiques mi-homme mi-loup, ils se cachent parmi les villageois le jour et les dévorent la nuit.',
        image_url: '/images/loup-garou.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Simple villageois',
        team: 'Village',
        description: 'vote chaque jour avec le village pour tuer quelqu\'un',
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
        description: 'se réveille chaque nuit pour connaître l\'identité d\'une personne',
        lore: 'Dotée de pouvoirs de divination, elle aide le village à identifier les Loups-Garous.',
        image_url: '/images/voyante.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Voleur',
        team: 'Village',
        description: 'chaque nuit, le voleur échange sa carte avec un autre joueur',
        lore: 'Opportuniste, il peut changer de rôle au début de la partie selon ce qui l\'arrange.',
        image_url: '/images/voleur.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Chasseur',
        team: 'Village',
        description: 'lorsqu\'il meurt, peut tuer quelqu\'un avec lui',
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
        description: 'la première nuit, il désigne deux joueurs qui seront amoureux',
        lore: 'Ses flèches créent un lien indéfectible : si l\'un des amoureux meurt, l\'autre meurt de chagrin.',
        image_url: '/images/cupidon.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "first_night_only"
      },
      {
        name: 'Sorcière',
        team: 'Village',
        description: 'possède des potions de vie et de mort',
        lore: 'Experte en potions, elle peut sauver une victime des Loups-Garous ou éliminer un joueur de son choix.',
        image_url: '/images/sorciere.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Petite fille',
        team: 'Village',
        description: 'peut tenter d\'épier les loups pendant qu\'ils choisissent une victime',
        lore: 'Curieuse et intrépide, elle risque sa vie pour obtenir des informations précieuses.',
        image_url: '/images/petite-fille.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },

      // Extensions
      {
        name: 'Salvateur',
        team: 'Village',
        description: 'choisit une personne chaque nuit qui sera protégé de la mort',
        lore: 'Protecteur du village, il peut empêcher la mort d\'un villageois chaque nuit.',
        image_url: '/images/salvateur.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Idiot du village',
        team: 'Village',
        description: 's\'il est tué par le vote du village, il est épargné mais perd le droit de vote',
        lore: 'Sa naïveté le protège parfois des accusations du village, mais lui fait perdre sa crédibilité.',
        image_url: '/images/idiot-du-village.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Bouc émissaire',
        team: 'Village',
        description: 's\'il y a égalité dans un vote du village, c\'est lui est tué à la place',
        lore: 'Malchanceux, il est toujours celui qu\'on accuse en cas de doute.',
        image_url: '/images/bouc-emissaire.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Ancien',
        team: 'Village',
        description: 's\'il est tué durant le vote du village, tous les joueurs sauf loup-garou perdent leur pouvoir',
        lore: 'Respecté pour sa sagesse, sa mort injuste provoque la perte de foi des villageois.',
        image_url: '/images/ancien.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Joueur de flûte',
        team: 'Seul',
        description: 'chaque nuit, enchante une personne, il gagne lorsque tout le village est enchanté',
        lore: 'Son objectif est de charmer tous les joueurs encore en vie pour gagner la partie.',
        image_url: '/images/joueur-de-flute.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Loup-garou blanc',
        team: 'Seul',
        description: 'une nuit sur deux, tue un joueur',
        lore: 'Solitaire et traître, il joue un double jeu pour être le dernier survivant.',
        image_url: '/images/loup-garou-blanc.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "1/2"
      },
      {
        name: 'Corbeau',
        team: 'Village',
        description: 'chaque nuit, il désigne un joueur qui aura deux plus contre lui lors du vote du village',
        lore: 'Son croassement sinistre attire l\'attention du village sur sa cible.',
        image_url: '/images/corbeau.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Enfant sauvage',
        team: 'Village',
        description: 'choisit un joueur modèle en début de partie, si celui-ci est tué par un loup, il devient un loup',
        lore: 'Élevé par les loups, il reste fidèle à son modèle humain, mais peut retourner à ses instincts sauvages.',
        image_url: '/images/enfant-sauvage.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "first_night_only"
      },
      {
        name: 'Renard',
        team: 'Village',
        description: 'chaque nuit, il choisit 3 joueurs, si l\'un d\'entre eux est loup, il garde son pouvoir',
        lore: 'Rusé et perspicace, il peut flairer la présence des loups-garous.',
        image_url: '/images/renard.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Servante dévouée',
        team: 'Village',
        description: 'lorsqu\'un joueur est mort, avant que son rôle soit révélé, elle peut échanger son rôle avec avec lui',
        lore: 'Loyale jusqu\'au bout, elle est prête à prendre la place d\'un autre pour le bien du village.',
        image_url: '/images/servante-devouee.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Trois frères',
        team: 'Village',
        description: 'peuvent se réveiller et communiquer sans parler',
        lore: 'Liés par le sang, ils s\'entraident pour démasquer les Loups-Garous.',
        image_url: '/images/trois-freres.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Deux soeurs',
        team: 'Village',
        description: 'peuvent se réveiller et communiquer sans parler',
        lore: 'Unies par un lien indéfectible, elles partagent leurs secrets et intuitions.',
        image_url: '/images/deux-soeurs.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Montreur d\'ours',
        team: 'Village',
        description: 'si son ours grogne le matin, alors l\'un des joueurs à côté de lui est un loup',
        lore: 'Son ours peut sentir la présence des loups-garous parmi les voisins de son maître.',
        image_url: '/images/montreur-ours.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Comédien',
        team: 'Village',
        description: 'pendant les trois premières nuits, il change de rôle',
        lore: 'Maître du déguisement, il peut imiter les pouvoirs des autres pour aider le village.',
        image_url: '/images/comedien.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: "1/3"
      },
      {
        name: 'Chevalier à l\'épée rouillée',
        team: 'Village',
        description: 's\'il est tué par les loups, ils ne font pas de victime la nuit suivante, et le premier loup à sa droite meurt',
        lore: 'Son épée rouillée mais redoutable peut blesser mortellement un loup-garou lors de sa dernière bataille.',
        image_url: '/images/chevalier-epee.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Juge bègue',
        team: 'Village',
        description: 'peut une fois, grâce à signe dicret convenu à l\'avance, choisir d\'effectuer un second vote du village',
        lore: 'Malgré son bégaiement, il peut ordonner un second vote quand il sent une injustice.',
        image_url: '/images/juge-begue.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Ange déchu',
        team: 'Seul',
        description: 'gagne s\'il meurt la première nuit ou le premier jour, la partie s\'arrête',
        lore: 'Être céleste dont la mission est de protéger le village, mais qui peut aussi chercher le martyre.',
        image_url: '/images/ange-dechu.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Abominable sectaire',
        team: 'Seul',
        description: 'divise le groupe en deux selon un critère, gagne lorsque les joueurs de l\'autre groupe que le sien sont morts',
        lore: 'Fanatique et déterminé, il traque les Loups-Garous avec une ferveur religieuse.',
        image_url: '/images/abominable-sectaire.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Infect père des loups',
        team: 'Seul',
        description: 'une fois dans la partie, peut convertir la victime des loups en loup',
        lore: 'Son pouvoir ancestral lui permet de transformer un humain en loup-garou.',
        image_url: '/images/infect-pere-loups.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "1/3"
      },
      {
        name: 'Chien-loup',
        team: 'Village',
        description: 'en début de partie, peut choisir entre villageois ou loup',
        lore: 'Déchiré entre deux natures, il doit choisir son camp au début de la partie.',
        image_url: '/images/chien-loup.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "first_night_only"
      },
      {
        name: 'Grand méchant loup',
        team: 'Loups',
        description: 'tant que personne du clan des loups n\'est mort, se réveille seul après les loups pour faire une deuxième victime',
        lore: 'Le plus redoutable des loups-garous, il peut faire une victime supplémentaire tant que sa meute est intacte.',
        image_url: '/images/grand-mechant-loup.png',
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
  // Get cards directly from the database with proper sorting
  const cards = db.prepare('SELECT * FROM cards ORDER BY id ASC').all();
  
  // Return the actual cards from the database without any ID manipulation
  res.json(cards);
});

// Route pour diagnostiquer et réparer les IDs des cartes
app.post('/api/fix-card-ids', (req, res) => {
  try {
    // Get current cards
    const cards = db.prepare('SELECT * FROM cards ORDER BY id ASC').all();
    console.log(`Found ${cards.length} cards before fixing`);

    // Check if there's a problem with the IDs
    const minId = Math.min(...cards.map(c => c.id));
    console.log(`Minimum card ID: ${minId}`);

    if (minId > 1 || cards.some((card, index) => card.id !== index + 1)) {
      // There's a problem with the IDs, let's fix it
      console.log('Fixing card IDs using optimized approach...');
      
      // Create a backup first
      db.exec('CREATE TABLE IF NOT EXISTS cards_backup AS SELECT * FROM cards');
      
      // Reset the SQLite sequence counter
      db.exec('DELETE FROM sqlite_sequence WHERE name="cards"');
      
      // Use a transaction for better performance
      db.transaction(() => {
        // Recreate table structure with proper autoincrement
        db.exec(`
          CREATE TABLE cards_new (
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
          );
          
          -- Copy all data in proper order
          INSERT INTO cards_new (name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency)
          SELECT name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency 
          FROM cards 
          ORDER BY id ASC;
          
          -- Drop the old table and rename the new one
          DROP TABLE cards;
          ALTER TABLE cards_new RENAME TO cards;
        `);
      })();
      
      // Get the fixed cards
      const fixedCards = db.prepare('SELECT * FROM cards ORDER BY id ASC').all();
      console.log(`Found ${fixedCards.length} cards after fixing`);
      console.log('First few card IDs after fixing:', fixedCards.slice(0, 5).map(c => c.id));

      // Validate the fix worked properly
      const allIdsFixed = fixedCards.every((card, index) => card.id === index + 1);

      res.status(200).json({
        message: allIdsFixed ? 'Card IDs fixed successfully' : 'Attempted to fix card IDs but validation check failed',
        before: {
          count: cards.length,
          minId: minId,
          maxId: Math.max(...cards.map(c => c.id))
        },
        after: {
          count: fixedCards.length,
          minId: Math.min(...fixedCards.map(c => c.id)),
          maxId: Math.max(...fixedCards.map(c => c.id)),
          allIdsSequential: allIdsFixed
        }
      });
    } else {
      res.status(200).json({
        message: 'Card IDs are already correct and sequential',
        count: cards.length,
        minId: minId,
        maxId: Math.max(...cards.map(c => c.id)),
        allIdsSequential: true
      });
    }
  } catch (error) {
    console.error('Error fixing card IDs:', error);
    res.status(500).json({ 
      message: 'Error fixing card IDs', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Route pour réinitialiser et repeupler la table des cartes
app.post('/api/reset-cards', authenticateToken, (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }

  try {
    // Approche radicale: vider complètement la table et réinitialiser la séquence
    db.exec('DELETE FROM cards; DELETE FROM sqlite_sequence WHERE name=\'cards\';');

    // Réinsérer toutes les cartes par défaut
    const defaultCards = [
      // Rôles de base
      {
        name: 'Loup-Garou',
        team: 'Loups-Garous',
        description: 'se réveille chaque nuit en meute pour faire une victime',
        lore: 'Créatures mythiques mi-homme mi-loup, ils se cachent parmi les villageois le jour et les dévorent la nuit.',
        image_url: '/images/loup-garou.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Simple villageois',
        team: 'Village',
        description: 'vote chaque jour avec le village pour tuer quelqu\'un',
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
        description: 'se réveille chaque nuit pour connaître l\'identité d\'une personne',
        lore: 'Dotée de pouvoirs de divination, elle aide le village à identifier les Loups-Garous.',
        image_url: '/images/voyante.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Voleur',
        team: 'Village',
        description: 'chaque nuit, le voleur échange sa carte avec un autre joueur',
        lore: 'Opportuniste, il peut changer de rôle au début de la partie selon ce qui l\'arrange.',
        image_url: '/images/voleur.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Chasseur',
        team: 'Village',
        description: 'lorsqu\'il meurt, peut tuer quelqu\'un avec lui',
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
        description: 'la première nuit, il désigne deux joueurs qui seront amoureux',
        lore: 'Ses flèches créent un lien indéfectible : si l\'un des amoureux meurt, l\'autre meurt de chagrin.',
        image_url: '/images/cupidon.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "first_night_only"
      },
      {
        name: 'Sorcière',
        team: 'Village',
        description: 'possède des potions de vie et de mort',
        lore: 'Experte en potions, elle peut sauver une victime des Loups-Garous ou éliminer un joueur de son choix.',
        image_url: '/images/sorciere.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Petite fille',
        team: 'Village',
        description: 'peut tenter d\'épier les loups pendant qu\'ils choisissent une victime',
        lore: 'Curieuse et intrépide, elle risque sa vie pour obtenir des informations précieuses.',
        image_url: '/images/petite-fille.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },

      // Extensions
      {
        name: 'Salvateur',
        team: 'Village',
        description: 'choisit une personne chaque nuit qui sera protégé de la mort',
        lore: 'Protecteur du village, il peut empêcher la mort d\'un villageois chaque nuit.',
        image_url: '/images/salvateur.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Idiot du village',
        team: 'Village',
        description: 's\'il est tué par le vote du village, il est épargné mais perd le droit de vote',
        lore: 'Sa naïveté le protège parfois des accusations du village, mais lui fait perdre sa crédibilité.',
        image_url: '/images/idiot-du-village.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Bouc émissaire',
        team: 'Village',
        description: 's\'il y a égalité dans un vote du village, c\'est lui est tué à la place',
        lore: 'Malchanceux, il est toujours celui qu\'on accuse en cas de doute.',
        image_url: '/images/bouc-emissaire.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Ancien',
        team: 'Village',
        description: 's\'il est tué durant le vote du village, tous les joueurs sauf loup-garou perdent leur pouvoir',
        lore: 'Respecté pour sa sagesse, sa mort injuste provoque la perte de foi des villageois.',
        image_url: '/images/ancien.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Joueur de flûte',
        team: 'Seul',
        description: 'chaque nuit, enchante une personne, il gagne lorsque tout le village est enchanté',
        lore: 'Son objectif est de charmer tous les joueurs encore en vie pour gagner la partie.',
        image_url: '/images/joueur-de-flute.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Loup-garou blanc',
        team: 'Seul',
        description: 'une nuit sur deux, tue un joueur',
        lore: 'Solitaire et traître, il joue un double jeu pour être le dernier survivant.',
        image_url: '/images/loup-garou-blanc.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "1/2"
      },
      {
        name: 'Corbeau',
        team: 'Village',
        description: 'chaque nuit, il désigne un joueur qui aura deux plus contre lui lors du vote du village',
        lore: 'Son croassement sinistre attire l\'attention du village sur sa cible.',
        image_url: '/images/corbeau.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Enfant sauvage',
        team: 'Village',
        description: 'choisit un joueur modèle en début de partie, si celui-ci est tué par un loup, il devient un loup',
        lore: 'Élevé par les loups, il reste fidèle à son modèle humain, mais peut retourner à ses instincts sauvages.',
        image_url: '/images/enfant-sauvage.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "first_night_only"
      },
      {
        name: 'Renard',
        team: 'Village',
        description: 'chaque nuit, il choisit 3 joueurs, si l\'un d\'entre eux est loup, il garde son pouvoir',
        lore: 'Rusé et perspicace, il peut flairer la présence des loups-garous.',
        image_url: '/images/renard.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Servante dévouée',
        team: 'Village',
        description: 'lorsqu\'un joueur est mort, avant que son rôle soit révélé, elle peut échanger son rôle avec avec lui',
        lore: 'Loyale jusqu\'au bout, elle est prête à prendre la place d\'un autre pour le bien du village.',
        image_url: '/images/servante-devouee.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Trois frères',
        team: 'Village',
        description: 'peuvent se réveiller et communiquer sans parler',
        lore: 'Liés par le sang, ils s\'entraident pour démasquer les Loups-Garous.',
        image_url: '/images/trois-freres.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Deux soeurs',
        team: 'Village',
        description: 'peuvent se réveiller et communiquer sans parler',
        lore: 'Unies par un lien indéfectible, elles partagent leurs secrets et intuitions.',
        image_url: '/images/deux-soeurs.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: null
      },
      {
        name: 'Montreur d\'ours',
        team: 'Village',
        description: 'si son ours grogne le matin, alors l\'un des joueurs à côté de lui est un loup',
        lore: 'Son ours peut sentir la présence des loups-garous parmi les voisins de son maître.',
        image_url: '/images/montreur-ours.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Comédien',
        team: 'Village',
        description: 'pendant les trois premières nuits, il change de rôle',
        lore: 'Maître du déguisement, il peut imiter les pouvoirs des autres pour aider le village.',
        image_url: '/images/comedien.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 1,
        wake_up_frequency: "1/3"
      },
      {
        name: 'Chevalier à l\'épée rouillée',
        team: 'Village',
        description: 's\'il est tué par les loups, ils ne font pas de victime la nuit suivante, et le premier loup à sa droite meurt',
        lore: 'Son épée rouillée mais redoutable peut blesser mortellement un loup-garou lors de sa dernière bataille.',
        image_url: '/images/chevalier-epee.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Juge bègue',
        team: 'Village',
        description: 'peut une fois, grâce à signe dicret convenu à l\'avance, choisir d\'effectuer un second vote du village',
        lore: 'Malgré son bégaiement, il peut ordonner un second vote quand il sent une injustice.',
        image_url: '/images/juge-begue.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Ange déchu',
        team: 'Seul',
        description: 'gagne s\'il meurt la première nuit ou le premier jour, la partie s\'arrête',
        lore: 'Être céleste dont la mission est de protéger le village, mais qui peut aussi chercher le martyre.',
        image_url: '/images/ange-dechu.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Abominable sectaire',
        team: 'Seul',
        description: 'divise le groupe en deux selon un critère, gagne lorsque les joueurs de l\'autre groupe que le sien sont morts',
        lore: 'Fanatique et déterminé, il traque les Loups-Garous avec une ferveur religieuse.',
        image_url: '/images/abominable-sectaire.png',
        is_custom: 0,
        wakes_up_at_night: 0,
        wakes_up_every_night: 0,
        wake_up_frequency: null
      },
      {
        name: 'Infect père des loups',
        team: 'Seul',
        description: 'une fois dans la partie, peut convertir la victime des loups en loup',
        lore: 'Son pouvoir ancestral lui permet de transformer un humain en loup-garou.',
        image_url: '/images/infect-pere-loups.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "1/3"
      },
      {
        name: 'Chien-loup',
        team: 'Village',
        description: 'en début de partie, peut choisir entre villageois ou loup',
        lore: 'Déchiré entre deux natures, il doit choisir son camp au début de la partie.',
        image_url: '/images/chien-loup.png',
        is_custom: 0,
        wakes_up_at_night: 1,
        wakes_up_every_night: 0,
        wake_up_frequency: "first_night_only"
      },
      {
        name: 'Grand méchant loup',
        team: 'Loups',
        description: 'tant que personne du clan des loups n\'est mort, se réveille seul après les loups pour faire une deuxième victime',
        lore: 'Le plus redoutable des loups-garous, il peut faire une victime supplémentaire tant que sa meute est intacte.',
        image_url: '/images/grand-mechant-loup.png',
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

    res.status(200).json({
      message: 'Table des cartes réinitialisée avec succès. Les IDs recommencent à 1.',
      count: defaultCards.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la réinitialisation de la table des cartes', error: error.message });
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
