/**
 * Google Calendar API client
 */

import axios from 'axios';

const BASE_URL = '/api/google-calendar';

/**
 * Get Google OAuth URL for authentication
 * @returns {Promise<{authUrl: string}>} The authentication URL
 */
export const getAuthUrl = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/auth-url`);
    return response.data;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - The authorization code from Google
 * @returns {Promise<{tokens: Object}>} The access and refresh tokens
 */
export const getTokensFromCode = async (code) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth-callback`, { code });
    return response.data;
  } catch (error) {
    console.error('Error getting tokens from code:', error);
    throw error;
  }
};

/**
 * Get calendar events
 * @param {string} accessToken - The Google API access token
 * @param {string} [calendarId='primary'] - The calendar ID
 * @param {number} [maxResults=10] - Maximum number of events to return
 * @returns {Promise<Array>} The calendar events
 */
export const getEvents = async (accessToken, calendarId = 'primary', maxResults = 10) => {
  try {
    const response = await axios.get(`${BASE_URL}/events`, {
      params: { accessToken, calendarId, maxResults }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} The new credentials
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${BASE_URL}/refresh-token`, { refreshToken });
    return response.data;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};

export default {
  getAuthUrl,
  getTokensFromCode,
  getEvents,
  refreshAccessToken
};
