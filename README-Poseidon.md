# Loups-Garous de Thiercelieux - Application Web

Une application web pour explorer les cartes du jeu Loups-Garous de Thiercelieux, gérer des événements et plus encore.

## Fonctionnalités

- Catalogue des cartes du jeu Loups-Garous
- Détails sur chaque carte (équipe, description, histoire)
- Distinction entre cartes officielles et personnalisées
- Recherche et filtrage des cartes
- Calendrier des événements
- Panneau d'administration pour gérer les cartes et événements

## Technologies utilisées

- Frontend: React, Vite
- Backend: Node.js, Express
- Base de données: SQLite
- Authentification: JWT

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

3. Configuration de l'environnement (recommandé)
   Créez un fichier `.env` à la racine du projet avec les variables suivantes:
   ```
   JWT_SECRET=votre_clé_secrète_jwt
   ADMIN_USERNAME=votre_nom_admin
   ADMIN_PASSWORD=votre_mot_de_passe_sécurisé
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

- Accédez à l'application via `http://localhost:5173`
- Parcourez le catalogue des cartes
- Utilisez les filtres pour trouver des cartes spécifiques
- Consultez le calendrier des événements
- Connectez-vous au panneau d'administration avec les identifiants définis dans votre fichier `.env` 
  (ou utilisez les identifiants par défaut que vous trouverez dans les logs du serveur au premier démarrage)

## Sécurité

Pour renforcer la sécurité de l'application en production:
- Changez le `JWT_SECRET` par défaut
- Modifiez les identifiants admin par défaut
- Considérez l'utilisation de HTTPS

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

Ce projet est sous licence MIT.
