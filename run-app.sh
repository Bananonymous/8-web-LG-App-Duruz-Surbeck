#!/bin/bash

# Installer toutes les dépendances (client et serveur)
echo "Installation des dépendances..."
npm install --legacy-peer-deps

# Installer les dépendances du serveur spécifiquement
echo "Installation des dépendances du serveur..."
npm install --prefix . -g nodemon
npm install --prefix . express cors jsonwebtoken bcrypt bcryptjs better-sqlite3

# Démarrer le serveur en arrière-plan
echo "Démarrage du serveur..."
node server.cjs &
SERVER_PID=$!

# Démarrer le client
echo "Démarrage du client..."
npm run dev 

# Arrêter le serveur lorsque le client est arrêté
kill $SERVER_PID
