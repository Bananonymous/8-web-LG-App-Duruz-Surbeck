# Les idiots du village
## Application Web de Gestion du Jeu Loups-Garous de Thiercelieux

### Description du Projet

**"Les idiots du village"** est une application web sophistiquée conçue pour faciliter l'animation et la gestion de parties de Loups-Garous de Thiercelieux. Cette application moderne offre une interface complète pour les maîtres du jeu (MJ), permettant de gérer des parties complexes avec de multiples rôles, variantes, et mécaniques avancées.

L'application combine un catalogue interactif des cartes de rôles, un système de gestion de parties en temps réel, un calendrier d'événements intégré avec Google Calendar, et un panneau d'administration complet. Elle s'adresse aux joueurs passionnés, aux clubs de jeux, et aux organisateurs d'événements souhaitant digitaliser et enrichir leur expérience de jeu.

### Thème et Contexte

Ce projet s'inscrit dans le cadre du développement d'applications web modernes utilisant les technologies React et Node.js. Il démontre la maîtrise de concepts avancés incluant :

- **Architecture fullstack** avec séparation frontend/backend
- **Intégration d'APIs externes** avec Google Calendar
- **Interface utilisateur responsive** avec Material-UI
- **Base de données relationnelle** SQLite
- **Système modulaire** pour l'extensibilité des rôles de jeu

### Technologies Utilisées

#### Frontend
- **React 18** avec hooks et context API
- **Vite** pour le bundling et le développement
- **Material-UI** pour les composants d'interface
- **React Router** pour la navigation
- **Axios** pour les appels API
- **React Beautiful DnD** pour les interactions drag & drop
- **React Big Calendar** pour l'affichage calendaire

#### Backend
- **Node.js** avec Express 5
- **SQLite** avec Better-SQLite3
- **JWT** pour l'authentification
- **Bcrypt** pour le hachage des mots de passe
- **CORS** pour la sécurité cross-origin

#### Intégrations
- **Google Calendar API** pour la gestion d'événements
- **Google Auth** pour l'authentification OAuth

### Architecture et Structure

```
src/
├── components/
│   ├── Admin/          # Panneau d'administration
│   ├── Auth/           # Authentification et protection des routes
│   ├── Calendar/       # Intégration Google Calendar
│   ├── Cards/          # Catalogue des cartes de rôles
│   ├── Game/           # Système de gestion de parties
│   ├── Layout/         # Navigation et mise en page
│   ├── UI/             # Composants d'interface réutilisables
│   └── Variants/       # Gestion des variantes de jeu
├── roles/
│   ├── village/        # Rôles du camp Village
│   ├── werewolf/       # Rôles du camp Loups-Garous
│   ├── solitaire/      # Rôles solitaires
│   ├── BaseRole.jsx    # Interface de base pour tous les rôles
│   ├── RoleFactory.jsx # Factory pattern pour le rendu dynamique
│   └── index.js        # Registre des rôles
├── context/            # Gestion d'état global (Auth, Theme)
├── services/           # Services API et intégrations
└── styles/             # Système de design et thèmes
```

### Fonctionnalités Principales

#### 1. Catalogue de Cartes Interactif
- **Base de données complète** : Plus de 30 rôles avec descriptions, équipes, et illustrations
- **Système de variantes** : Support pour différentes extensions du jeu
- **Interface de recherche** : Filtrage par équipe, type, et capacités spéciales
- **Détails enrichis** : Lore, stratégies, et mécaniques détaillées pour chaque rôle

#### 2. Système de Gestion de Parties
- **Configuration flexible** : Sélection de rôles, nombre de joueurs, variantes
- **Interface MJ avancée** : Gestion des phases de jeu, tour par tour
- **Mécaniques complexes** : 
  - Système d'infection (Infect Père des Loups)
  - Gestion des couples d'amoureux (Cupidon)
  - Pouvoirs spéciaux (Sorcière, Salvateur, Ancien)
  - Rôles à réveil conditionnel
- **Sauvegarde automatique** : Persistance de l'état de partie
- **Gestion des morts** : Interface pour jouer les rôles posthumes

#### 3. Système de Rôles Modulaire
- **Architecture extensible** : Factory pattern pour l'ajout de nouveaux rôles
- **Composants spécialisés** : Interface unique pour chaque rôle
- **Ordre de réveil configurable** : Personnalisation via panneau admin
- **Validation des actions** : Vérification des règles et contraintes

#### 4. Calendrier d'Événements
- **Intégration Google Calendar** : Synchronisation temps réel
- **Interface moderne** : Vue mensuelle avec détails des événements
- **Gestion responsive** : Adaptation mobile et desktop
- **Vue de liste** : Affichage des prochains événements

#### 5. Panneau d'Administration
- **Gestion des utilisateurs** : Création, modification, droits admin
- **Configuration des rôles** : Ordre de réveil, propriétés spéciales

### Installation et Déploiement

#### Prérequis
- Node.js 18+ 
- NPM ou Yarn
- Clé API Google Calendar (requis uniquement pour la fonctionnalité de calendrier)

#### Installation
```bash
# Clone du repository
git clone [URL_REPOSITORY]
cd 8-web-LG-App-Duruz-Surbeck

# Installation des dépendances
npm install

# Initialisation de la base de données
npm run init-db

# Configuration (optionnel mais nécessaire pour Google Calendar)
cp .env.example .env
# Éditer .env avec vos clés API
```

#### Développement
```bash
# Lancement du serveur de développement
npm run dev

# Lancement du backend (terminal séparé)
node server.cjs
```

#### Production
```bash
# Build de production
npm run build

# Démarrage de l'application
./run-app.sh
```

### Configuration Google Calendar

L'application support l'intégration optionnelle avec Google Calendar pour afficher des événements réels. Voir `GOOGLE_CALENDAR_SETUP.md` pour les instructions détaillées de configuration.

### Sécurité

- **Authentification JWT** : Tokens sécurisés avec expiration
- **Hachage des mots de passe** : Bcrypt avec salt
- **Protection CORS** : Configuration stricte des origines
- **Validation des entrées** : Sanitisation côté client et serveur
- **Gestion des sessions** : Déconnexion automatique

### Documentation Technique

#### Base de Données
Le schéma SQLite comprend :
- **cards** : Rôles de base avec propriétés complètes
- **variants** : Extensions et variantes de jeu
- **variant_cards** : Rôles spécifiques aux variantes
- **users** : Utilisateurs avec authentification
- **wake_up_order** : Configuration personnalisée des tours

#### API Endpoints
- `GET /api/cards` : Liste des cartes disponibles
- `GET /api/variants` : Variantes et extensions
- `POST /api/auth/login` : Authentification utilisateur
- `GET /api/calendar/events` : Événements Google Calendar
- `POST /api/admin/*` : Endpoints d'administration

### Évolutions Futures

- **Mode multijoueur en ligne** : WebSocket pour parties distantes
- **Statistiques avancées** : Analytics des parties
- **Intégration Discord** : Bot pour serveurs de jeu
- **Extensions de rôles** : Ajout de nouveaux rôles et variantes

### Crédits et Licence

Développé dans le cadre du cours de développement web. Application basée sur le jeu "Les Loups-Garous de Thiercelieux".

**Auteurs** : Duruz Florian et Surbeck Léon (Nous avons travaillé sur le même ordinateur en screensharing)
**Institution** : HEIG-VD

---
