-- Database initialization for Werewolf Game
-- This file contains all the SQL needed to initialize the database

-- Create tables
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
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  location TEXT
);

CREATE TABLE IF NOT EXISTS variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  image_url TEXT
);

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
);

CREATE TABLE IF NOT EXISTS wake_up_order (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id TEXT NOT NULL,
  include_base BOOLEAN DEFAULT 1,
  order_data TEXT NOT NULL
);

-- Insert default admin user
INSERT OR IGNORE INTO users (username, password, is_admin)
VALUES ('admin', '$2a$10$JqPzUZuCbTvXZRqPcZqgH.Ot.QJA5QYZlGbUxLJLy5YwMKxXwE8Vy', 1);
-- Password is 'admin123' (bcrypt hashed)

-- Insert default events
INSERT OR IGNORE INTO events (title, date, description, location)
VALUES
('Soirée Loups-Garous', '2023-12-15', 'Venez jouer aux Loups-Garous de Thiercelieux !', 'Ludothèque de la ville'),
('Tournoi Loups-Garous', '2024-01-20', 'Grand tournoi annuel de Loups-Garous', 'Salle des fêtes');

-- Insert default variants
INSERT OR IGNORE INTO variants (name, description, lore, image_url)
VALUES
('Nouvelle Lune', 'Une variante qui introduit de nouveaux rôles et mécaniques de jeu.',
'Sous la nouvelle lune, des pouvoirs mystérieux s''éveillent et de nouvelles alliances se forment dans le village de Thiercelieux.',
'/images/nouvelle_lune.svg');

-- Insert variant cards
INSERT OR IGNORE INTO variant_cards (variant_id, name, team, description, lore, image_url, wakes_up_at_night, wakes_up_every_night, wake_up_frequency)
VALUES
(1, 'Chaman', 'Village', 'Le Chaman peut communiquer avec les morts une fois par nuit.',
'Gardien des traditions ancestrales, il peut entrer en contact avec l''au-delà pour guider les vivants.',
'/images/chaman.svg', 1, 1, null),

(1, 'Loup Alpha', 'Loups-Garous', 'Le Loup Alpha peut transformer un villageois en Loup-Garou une fois par partie.',
'Chef de la meute, son hurlement peut réveiller la bête qui sommeille en chaque humain.',
'/images/loup_alpha.svg', 1, 0, '1/3 nights');

-- Insert base game cards
INSERT OR IGNORE INTO cards (name, team, description, lore, image_url, is_custom, wakes_up_at_night, wakes_up_every_night, wake_up_frequency)
VALUES
-- Village team
('Simple villageois', 'Village', 'vote chaque jour avec le village pour tuer quelqu''un',
'Simples habitants du village, ils doivent faire preuve de perspicacité pour démasquer les Loups-Garous.',
'/images/villageois.png', 0, 0, 0, null),

('Voyante', 'Village', 'se réveille chaque nuit pour connaître l''identité d''une personne',
'Dotée de pouvoirs de divination, elle aide le village à identifier les Loups-Garous.',
'/images/voyante.png', 0, 1, 1, null),

('Voleur', 'Village', 'chaque nuit, le voleur échange sa carte avec un autre joueur',
'Opportuniste, il peut changer de rôle au début de la partie selon ce qui l''arrange.',
'/images/voleur.png', 0, 1, 1, null),

('Chasseur', 'Village', 'lorsqu''il meurt, peut tuer quelqu''un avec lui',
'Même dans la mort, le Chasseur ne part pas sans emporter quelqu''un avec lui.',
'/images/chasseur.png', 0, 0, 0, null),

('Cupidon', 'Village', 'la première nuit, il désigne deux joueurs qui seront amoureux',
'Ses flèches créent un lien indéfectible : si l''un des amoureux meurt, l''autre meurt de chagrin.',
'/images/cupidon.png', 0, 1, 0, 'first_night_only'),

('Sorcière', 'Village', 'possède des potions de vie et de mort',
'Experte en potions, elle peut sauver une victime des Loups-Garous ou éliminer un joueur de son choix.',
'/images/sorciere.png', 0, 1, 1, null),

('Petite fille', 'Village', 'peut tenter d''épier les loups pendant qu''ils choisissent une victime',
'Curieuse et intrépide, elle risque sa vie pour obtenir des informations précieuses.',
'/images/petite_fille.png', 0, 1, 1, null),

('Salvateur', 'Village', 'choisit une personne chaque nuit qui sera protégé de la mort',
'Protecteur du village, il peut empêcher la mort d''un villageois chaque nuit.',
'/images/salvateur.png', 0, 1, 1, null),

('Idiot du village', 'Village', 's''il est tué par le vote du village, il est épargné mais perd le droit de vote',
'Sa naïveté le protège parfois des accusations du village, mais lui fait perdre sa crédibilité.',
'/images/idiot_du_village.png', 0, 0, 0, null),

('Bouc émissaire', 'Village', 's''il y a égalité dans un vote du village, c''est lui est tué à la place',
'Malchanceux, il est toujours celui qu''on accuse en cas de doute.',
'/images/bouc_emissaire.png', 0, 0, 0, null),

('Ancien', 'Village', 's''il est tué durant le vote du village, tous les joueurs sauf loup-garou perdent leur pouvoir',
'Respecté pour sa sagesse, sa mort injuste provoque la perte de foi des villageois.',
'/images/ancien.png', 0, 0, 0, null),

('Corbeau', 'Village', 'chaque nuit, il désigne un joueur qui aura deux plus contre lui lors du vote du village',
'Son croassement sinistre attire l''attention du village sur sa cible.',
'/images/corbeau.png', 0, 1, 1, null),

('Enfant sauvage', 'Village', 'choisit un joueur modèle en début de partie, si celui-ci est tué par un loup, il devient un loup',
'Élevé par les loups, il reste fidèle à son modèle humain, mais peut retourner à ses instincts sauvages.',
'/images/enfant_sauvage.png', 0, 1, 0, 'first_night_only'),

('Renard', 'Village', 'chaque nuit, il choisit 3 joueurs, si l''un d''entre eux est loup, il garde son pouvoir',
'Rusé et perspicace, il peut flairer la présence des loups-garous.',
'/images/renard.png', 0, 1, 1, null),

('Servante dévouée', 'Village', 'lorsqu''un joueur est mort, avant que son rôle soit révélé, elle peut échanger son rôle avec avec lui',
'Loyale jusqu''au bout, elle est prête à prendre la place d''un autre pour le bien du village.',
'/images/servante_devouee.png', 0, 0, 0, null),

('Trois frères', 'Village', 'peuvent se réveiller et communiquer sans parler',
'Liés par le sang, ils s''entraident pour démasquer les Loups-Garous.',
'/images/trois_freres.png', 0, 1, 1, null),

('Deux soeurs', 'Village', 'peuvent se réveiller et communiquer sans parler',
'Unies par un lien indéfectible, elles partagent leurs secrets et intuitions.',
'/images/deux_soeurs.png', 0, 1, 1, null),

('Montreur d''ours', 'Village', 'si son ours grogne le matin, alors l''un des joueurs à côté de lui est un loup',
'Son ours peut sentir la présence des loups-garous parmi les voisins de son maître.',
'/images/montreur_ours.png', 0, 0, 0, null),

('Comédien', 'Village', 'pendant les trois premières nuits, il change de rôle',
'Maître du déguisement, il peut imiter les pouvoirs des autres pour aider le village.',
'/images/comedien.png', 0, 1, 1, '1/3'),

('Chevalier à l''épée rouillée', 'Village', 's''il est tué par les loups, ils ne font pas de victime la nuit suivante, et le premier loup à sa droite meurt',
'Son épée rouillée mais redoutable peut blesser mortellement un loup-garou lors de sa dernière bataille.',
'/images/chevalier_epee.png', 0, 0, 0, null),

('Juge bègue', 'Village', 'peut une fois, grâce à signe dicret convenu à l''avance, choisir d''effectuer un second vote du village',
'Malgré son bégaiement, il peut ordonner un second vote quand il sent une injustice.',
'/images/juge_begue.png', 0, 0, 0, null),

('Capitaine', 'Village', 'Le vote du Capitaine compte double. Si le Capitaine meurt, il désigne son successeur.',
'Son autorité naturelle lui confère un poids supplémentaire dans les décisions du village.',
'/images/capitaine.png', 0, 0, 0, null),

('Villageois-Villageois', 'Village', 'Le Villageois-Villageois est un simple villageois, mais tout le monde sait qu''il n''est pas Loup-Garou.',
'Sa nature est si évidente que personne ne peut douter de son innocence.',
'/images/villageois_villageois.png', 0, 0, 0, null),

('Gitane', 'Village', 'Une fois par partie, la Gitane peut protéger quelqu''un de l''attaque des Loups-Garous.',
'Mystérieuse voyageuse aux pouvoirs occultes, elle peut détourner le malheur.',
'/images/gitane.png', 0, 0, 0, null),

('Abominable sectaire', 'Village', 'L''Abominable sectaire peut désigner un joueur chaque nuit. Si ce joueur est un Loup-Garou, il meurt.',
'Fanatique et déterminé, il traque les Loups-Garous avec une ferveur religieuse.',
'/images/abominable_sectaire.png', 0, 0, 0, null),

('Ange', 'Village', 'Si l''Ange est éliminé lors du premier vote du village, il gagne la partie immédiatement.',
'Être céleste dont la mission est de protéger le village, mais qui peut aussi chercher le martyre.',
'/images/ange.png', 0, 0, 0, null),

('Chien-loup', 'Village', 'en début de partie, peut choisir entre villageois ou loup',
'Déchiré entre deux natures, il doit choisir son camp au début de la partie.',
'/images/chien_loup.png', 0, 1, 0, 'first_night_only'),

-- Loups-Garous team
('Loup-Garou', 'Loups-Garous', 'se réveille chaque nuit en meute pour faire une victime',
'Créatures mythiques mi-homme mi-loup, ils se cachent parmi les villageois le jour et les dévorent la nuit.',
'/images/loup_garou.png', 0, 1, 1, null),

('Grand méchant loup', 'Loups-Garous', 'tant que personne du clan des loups n''est mort, se réveille seul après les loups pour faire une deuxième victime',
'Le plus redoutable des loups-garous, il peut faire une victime supplémentaire tant que sa meute est intacte.',
'/images/grand_mechant_loup.png', 0, 1, 1, null),

('Infect père des loups', 'Loups-Garous', 'une fois dans la partie, peut convertir la victime des loups en loup',
'Son pouvoir ancestral lui permet de transformer un humain en loup-garou.',
'/images/infect_pere_loups.png', 0, 1, 0, '1/3'),

-- Solitaire team
('Joueur de flûte', 'Solitaire', 'chaque nuit, enchante une personne, il gagne lorsque tout le village est enchanté',
'Son objectif est de charmer tous les joueurs encore en vie pour gagner la partie.',
'/images/joueur_de_flute.png', 0, 1, 1, null),

('Loup-garou blanc', 'Solitaire', 'une nuit sur deux, tue un joueur',
'Solitaire et traître, il joue un double jeu pour être le dernier survivant.',
'/images/loup_garou_blanc.png', 0, 1, 0, '1/2'),

('Ange déchu', 'Solitaire', 'gagne s''il meurt la première nuit ou le premier jour, la partie s''arrête',
'Être céleste dont la mission est de protéger le village, mais qui peut aussi chercher le martyre.',
'/images/ange_dechu.png', 0, 0, 0, null),

('Pyromane', 'Solitaire', 'Le Pyromane peut asperger d''essence un joueur chaque nuit, puis tous les brûler pour gagner.',
'Fasciné par le feu, il prépare méthodiquement son grand spectacle final.',
'/images/pyromane.png', 0, 1, 1, null);
