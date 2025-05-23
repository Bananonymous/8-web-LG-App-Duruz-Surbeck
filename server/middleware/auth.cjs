/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { createLogger } = require('../../lib/logger.cjs');
const logger = createLogger('Auth');

// JWT secret from environment variable or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_jwt';

if (JWT_SECRET === 'votre_clé_secrète_jwt') {
  logger.warn('Using default JWT_SECRET. Set JWT_SECRET environment variable for production use.');
}

// Middleware to authenticate JWT token
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

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isAdmin,
  JWT_SECRET
};
