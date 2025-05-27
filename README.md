# Loups-Garous de Thiercelieux - Application Web

Une application web complète pour gérer et jouer aux Loups-Garous de Thiercelieux, incluant un catalogue de cartes, un gestionnaire de partie, un calendrier intégré avec Google Calendar et un système d'administration.

## Fonctionnalités

### Catalogue de Cartes
- Affichage de toutes les cartes du jeu Loups-Garous de Thiercelieux
- Détails sur chaque carte (équipe, description, histoire, image)
- Distinction entre cartes officielles et personnalisées
- Recherche et filtrage des cartes par nom, description et équipe
- Affichage des cartes par équipe (Village, Loups-Garous, Solitaire)

### Gestionnaire de Partie
- Interface complète pour gérer une partie de Loups-Garous
- Configuration de partie avec sélection des joueurs et des rôles
- Gestion des phases de jeu (jour/nuit)
- Suivi des joueurs vivants et morts
- Gestion des rôles spéciaux et leurs pouvoirs:
  - Voyante: révélation de l'identité d'un joueur
  - Sorcière: potions de vie et de mort
  - Cupidon: création de couples amoureux
  - Chasseur: capacité de tuer quelqu'un en mourant
  - Et tous les autres rôles du jeu

### Variantes de Jeu
- Support pour différentes variantes du jeu
- Possibilité d'ajouter des cartes spécifiques à chaque variante
- Configuration de l'ordre de réveil des rôles pour chaque variante

### Calendrier d'Événements
- Intégration avec Google Calendar pour afficher les événements
- Interface interactive avec vue mensuelle, hebdomadaire et quotidienne
- Connexion avec votre compte Google pour synchroniser vos événements
- Affichage des détails complets des événements (date, lieu, description)

### Panneau d'Administration
- Gestion complète des cartes (ajout, modification, suppression)
- Configuration des paramètres de l'application
- Gestion des variantes et de leurs cartes spécifiques
- Configuration de l'ordre de réveil des rôles
- Réinitialisation de la base de données
- Système d'authentification sécurisé

### Interface Utilisateur
- Design responsive pour mobile et desktop
- Thème sombre inspiré de l'univers des Loups-Garous
- Affichage des images de cartes avec fallback
- Animations et transitions pour une expérience utilisateur fluide
- Indicateurs visuels pour les joueurs amoureux (cœurs)
- Possibilité de tuer ou ressusciter manuellement des joueurs

## Technologies utilisées

- **Frontend**:
  - React 18 avec hooks
  - React Router pour la navigation
  - CSS modules pour le styling
  - Vite comme bundler
  - Axios pour les requêtes HTTP

- **Backend**:
  - Node.js
  - Express pour l'API REST
  - SQLite comme base de données
  - Better-SQLite3 pour les interactions avec la base de données
  - JWT pour l'authentification
  - Bcrypt pour le hachage des mots de passe

## Structure de la Base de Données

- **cards**: Cartes du jeu de base
- **variant_cards**: Cartes spécifiques aux variantes
- **variants**: Différentes variantes du jeu
- **users**: Utilisateurs administrateurs
- **wake_up_order**: Configuration de l'ordre de réveil des rôles

## Installation

1. Clonez le dépôt
   ```
   git clone https://github.com/votre-nom/loup-garous-app.git
   cd loup-garous-app
   ```

2. Installez les dépendances
   ```
   npm install
   ```

3. **Configuration des variables d'environnement** (Important!)
   ```bash
   # Copiez le fichier exemple
   cp .env.example .env
   
   # Modifiez .env avec vos vraies clés API
   # IMPORTANT: Ne jamais commiter le fichier .env (il est dans .gitignore)
   ```

4. Démarrez le serveur de développement
   ```
   npm run dev
   ```

5. Dans un autre terminal, démarrez le serveur backend
   ```
   node server.cjs
   ```

## Utilisation

### Accès à l'Application
- Accédez à l'application via `http://localhost:5173`
- L'application est immédiatement utilisable sans compte pour consulter les cartes et jouer

### Gestion d'une Partie
1. Accédez à "Gérer une Partie" depuis la page d'accueil
2. Configurez les joueurs et leurs rôles
3. Utilisez l'interface pour gérer les phases jour/nuit
4. Suivez les instructions à l'écran pour chaque rôle

### Panneau d'Administration
- Accédez au panneau d'administration via `/admin`
- Connectez-vous avec:
  - Nom d'utilisateur: admin
  - Mot de passe: admin123
- Gérez les cartes, événements et variantes
- Configurez l'ordre de réveil des rôles

## API REST

L'application expose une API REST complète:

- **GET /api/cards**: Liste toutes les cartes
- **GET /api/cards/:id**: Détails d'une carte spécifique
- **POST /api/cards**: Ajoute une nouvelle carte (admin)
- **PUT /api/cards/:id**: Modifie une carte existante (admin)
- **DELETE /api/cards/:id**: Supprime une carte (admin)
- **GET /api/google-calendar/events**: Liste les événements Google Calendar
- **GET /api/google-calendar/auth-url**: Obtient l'URL d'authentification Google
- **POST /api/google-calendar/auth-callback**: Gère le callback d'authentification Google
- **POST /api/google-calendar/refresh-token**: Rafraîchit le token d'accès Google
- **GET /api/variants**: Liste toutes les variantes
- **GET /api/variant-cards**: Liste les cartes d'une variante
- **POST /api/login**: Authentification
- **GET /api/verify-token**: Vérifie la validité d'un token JWT

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

### Processus de Contribution
1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add some amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## Licence

Ce projet est sous licence MIT.

## Remerciements

- Inspiré par le jeu de société "Les Loups-Garous de Thiercelieux" créé par Philippe des Pallières et Hervé Marly
- Images et descriptions utilisées à des fins éducatives et de démonstration
