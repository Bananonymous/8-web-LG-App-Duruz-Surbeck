-- Add new cards to the database
-- First, let's create a list of cards to add

-- Village team cards
INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Abominable sectaire', 'Village', 'L''Abominable sectaire peut désigner un joueur chaque nuit. Si ce joueur est un Loup-Garou, il meurt.', 'Fanatique et déterminé, il traque les Loups-Garous avec une ferveur religieuse.', '/images/abominable-sectaire.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Ange', 'Village', 'Si l''Ange est éliminé lors du premier vote du village, il gagne la partie immédiatement.', 'Être céleste dont la mission est de protéger le village, mais qui peut aussi chercher le martyre.', '/images/ange.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Chevalier à l''Épée Rouillée', 'Village', 'Si le Chevalier est dévoré par les Loups-Garous, le plus jeune Loup-Garou meurt également.', 'Même après sa mort, son épée rouillée peut encore blesser mortellement un Loup-Garou.', '/images/chevalier-epee-rouillee.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Chien-loup', 'Village', 'Au début de la partie, le Chien-loup choisit s''il rejoint le camp des Villageois ou des Loups-Garous.', 'Mi-chien, mi-loup, il doit choisir son camp et y rester fidèle jusqu''à la fin.', '/images/chien-loup.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Comédien', 'Village', 'Chaque nuit, le Comédien peut choisir un pouvoir parmi ceux des cartes non distribuées.', 'Maître du déguisement, il peut imiter les pouvoirs des autres pour aider le village.', '/images/comedien.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Deux Sœurs', 'Village', 'Les Deux Sœurs se reconnaissent la première nuit et peuvent communiquer chaque nuit.', 'Unies par un lien indéfectible, elles partagent leurs secrets et intuitions.', '/images/deux-soeurs.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Enfant Sauvage', 'Village', 'L''Enfant Sauvage choisit un modèle au début du jeu. Si ce modèle meurt, il devient Loup-Garou.', 'Élevé par les loups, il reste fidèle à son modèle humain, mais peut retourner à ses instincts sauvages.', '/images/enfant-sauvage.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Gitane', 'Village', 'Une fois par partie, la Gitane peut protéger quelqu''un de l''attaque des Loups-Garous.', 'Mystérieuse voyageuse aux pouvoirs occultes, elle peut détourner le malheur.', '/images/gitane.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Juge Bègue', 'Village', 'Une fois par partie, le Juge Bègue peut demander un second vote après le vote du village.', 'Sa parole est difficile mais son jugement est respecté de tous.', '/images/juge-begue.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Montreur d''ours', 'Village', 'Chaque matin, le Montreur d''ours indique si un Loup-Garou se trouve à côté de lui.', 'Son ours grogne en présence des Loups-Garous, révélant leur proximité.', '/images/montreur-ours.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Renard', 'Village', 'Chaque nuit, le Renard peut flairer un joueur et savoir si lui ou ses voisins sont Loups-Garous.', 'Rusé et perspicace, son flair lui permet de détecter la présence des Loups-Garous.', '/images/renard.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Servante Dévouée', 'Village', 'La Servante Dévouée peut prendre la place d''un joueur mort pendant la nuit.', 'Loyale jusqu''au sacrifice, elle est prête à remplacer un villageois important.', '/images/servante-devouee.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Trois Frères', 'Village', 'Les Trois Frères se reconnaissent la première nuit et peuvent communiquer chaque nuit.', 'Liés par le sang, ils s''entraident pour démasquer les Loups-Garous.', '/images/trois-freres.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Villageois-Villageois', 'Village', 'Le Villageois-Villageois est un simple villageois, mais tout le monde sait qu''il n''est pas Loup-Garou.', 'Sa nature est si évidente que personne ne peut douter de son innocence.', '/images/villageois-villageois.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Corbeau', 'Village', 'Chaque nuit, le Corbeau peut désigner un joueur qui aura une voix supplémentaire contre lui lors du vote.', 'Son croassement sinistre attire l''attention du village sur sa cible.', '/images/corbeau.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Capitaine', 'Village', 'Le vote du Capitaine compte double. Si le Capitaine meurt, il désigne son successeur.', 'Son autorité naturelle lui confère un poids supplémentaire dans les décisions du village.', '/images/capitaine.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Ancien', 'Village', 'L''Ancien peut survivre à une première attaque des Loups-Garous. S''il est tué par les Villageois, ces derniers perdent leurs pouvoirs.', 'Sa sagesse et sa résistance en font un pilier du village, à protéger à tout prix.', '/images/ancien.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Bouc Émissaire', 'Village', 'En cas d''égalité lors du vote, le Bouc Émissaire est automatiquement éliminé.', 'Toujours soupçonné, il est la victime désignée quand le village ne parvient pas à se décider.', '/images/bouc-emissaire.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Idiot du Village', 'Village', 'Si l''Idiot du Village est condamné par le vote, il n''est pas éliminé mais perd son droit de vote.', 'Sa simplicité d''esprit le protège paradoxalement de la vindicte populaire.', '/images/idiot-du-village.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Salvateur', 'Village', 'Chaque nuit, le Salvateur peut protéger un joueur de l''attaque des Loups-Garous, mais pas deux fois de suite la même personne.', 'Ses prières et ses onguents peuvent sauver une vie chaque nuit.', '/images/salvateur.png', 0);

-- Existing village cards (already in database)
-- Chasseur, Cupidon, Petite fille, Simple villageois, Sorcière, Voleur, Voyante

-- Loups-Garous team cards
INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Grand méchant loup', 'Loups-Garous', 'Le Grand méchant loup peut dévorer seul une victime supplémentaire chaque nuit.', 'Plus féroce et sanguinaire que ses congénères, il peut chasser seul.', '/images/grand-mechant-loup.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('L''infect père des loups', 'Loups-Garous', 'L''Infect père des loups peut transformer sa victime en Loup-Garou au lieu de la dévorer.', 'Patriarche de la meute, il peut transmettre la malédiction lycanthropique.', '/images/infect-pere-des-loups.png', 0);

-- Existing Loups-Garous cards (already in database)
-- Loup-garou

-- Solitaire team cards
INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Loup Blanc', 'Solitaire', 'Le Loup Blanc est un Loup-Garou qui gagne s''il est le dernier survivant. Il se réveille après les autres Loups-Garous.', 'Albinos rejeté par sa meute, il joue un double jeu pour éliminer tous les autres joueurs.', '/images/loup-blanc.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Pyromane', 'Solitaire', 'Le Pyromane peut asperger d''essence un joueur chaque nuit, puis tous les brûler pour gagner.', 'Fasciné par le feu, il prépare méthodiquement son grand spectacle final.', '/images/pyromane.png', 0);

INSERT INTO cards (name, team, description, lore, image_url, is_custom) 
VALUES ('Joueur de Flûte', 'Solitaire', 'Chaque nuit, le Joueur de Flûte peut charmer 2 joueurs. Il gagne si tous les joueurs vivants sont charmés.', 'Sa mélodie envoûtante lui permet de manipuler les villageois et les loups-garous.', '/images/joueur-de-flute.png', 0);
