#!/bin/bash

# Installer toutes les dépendances (client et serveur)
echo "Installation des dépendances..."
npm install --legacy-peer-deps

# Les dépendances du serveur sont déjà incluses dans package.json

# Démarrer le serveur en arrière-plan
echo "Démarrage du serveur..."
node server.cjs &
SERVER_PID=$!

# Démarrer le client
echo "Démarrage du client..."
npm run dev 

# Arrêter le serveur lorsque le client est arrêté
kill $SERVER_PID
