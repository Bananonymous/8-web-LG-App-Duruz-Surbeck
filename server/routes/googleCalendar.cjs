/**
 * Google Calendar API Routes
 */

const express = require('express');
const router = express.Router();
const { createLogger } = require('../../lib/logger.cjs');
const logger = createLogger('GoogleCalendarRoutes');
const googleCalendarService = require('../services/googleCalendar.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// Get Google OAuth URL
router.get('/auth-url', (req, res) => {
  try {
    const authUrl = googleCalendarService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    logger.error('Error getting auth URL:', error);
    res.status(500).json({ message: 'Error getting auth URL', error: error.message });
  }
});

// Handle OAuth callback
router.post('/auth-callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    const tokens = await googleCalendarService.getTokenFromCode(code);

    // In a production app, you would store these tokens securely
    // Here we just return them to the client
    res.json({ tokens });
  } catch (error) {
    logger.error('Error in auth callback:', error);
    res.status(500).json({ message: 'Error processing authorization', error: error.message });
  }
});

// Get calendar events
router.get('/events', async (req, res) => {
  try {
    const { accessToken, calendarId, maxResults } = req.query;

    if (!accessToken) {
      return res.status(400).json({ message: 'Access token is required' });
    }

    const events = await googleCalendarService.getEvents(
      accessToken,
      calendarId || 'primary',
      maxResults ? parseInt(maxResults) : 10
    );

    res.json(events);
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching calendar events', error: error.message });
  }
});

// Refresh access token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const credentials = await googleCalendarService.refreshAccessToken(refreshToken);
    res.json(credentials);
  } catch (error) {
    logger.error('Error refreshing token:', error);
    res.status(500).json({ message: 'Error refreshing access token', error: error.message });
  }
});

module.exports = router;
