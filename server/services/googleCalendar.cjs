/**
 * Google Calendar API Service
 * Handles integration with Google Calendar API
 */

const { google } = require('googleapis');
const { createLogger } = require('../../lib/logger.cjs');
const logger = createLogger('GoogleCalendar');

// Configuration for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// Create a new OAuth2 client
const createOAuth2Client = () => {
  try {
    const credentials = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
    };

    if (!credentials.client_id || !credentials.client_secret || !credentials.redirect_uri) {
      logger.error('Missing Google OAuth credentials in environment variables');
      throw new Error('Missing Google OAuth credentials');
    }

    return new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri
    );
  } catch (error) {
    logger.error('Error creating OAuth2 client:', error);
    throw error;
  }
};

// Generate authorization URL
const getAuthUrl = () => {
  try {
    const oauth2Client = createOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  } catch (error) {
    logger.error('Error generating auth URL:', error);
    throw error;
  }
};

// Get access token from authorization code
const getTokenFromCode = async (code) => {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    logger.error('Error getting token from code:', error);
    throw error;
  }
};

// Get calendar events
const getEvents = async (accessToken, calendarId = 'primary', maxResults = 10) => {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: (new Date()).toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    logger.error('Error fetching calendar events:', error);
    throw error;
  }
};

// Refresh access token
const refreshAccessToken = async (refreshToken) => {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    logger.error('Error refreshing access token:', error);
    throw error;
  }
};

module.exports = {
  getAuthUrl,
  getTokenFromCode,
  getEvents,
  refreshAccessToken
};
