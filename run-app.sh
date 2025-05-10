#!/bin/bash

# Installer les dépendances du serveur
echo "Installation des dépendances du serveur..."
npm install --prefix . -g nodemon
npm install --prefix . express cors jsonwebtoken bcrypt better-sqlite3

# Démarrer le serveur en arrière-plan
echo "Démarrage du serveur..."
node server.cjs &
SERVER_PID=$!

# Démarrer le client
echo "Démarrage du client..."
npm run dev

# Arrêter le serveur lorsque le client est arrêté
kill $SERVER_PID
