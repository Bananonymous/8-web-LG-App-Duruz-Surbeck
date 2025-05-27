# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration for the French Werewolf application.

## Current Status

The application is currently configured to show **NO events** until a real Google Calendar is properly configured. This ensures only real events are displayed.

## Setting up Real Google Calendar Integration

To connect to a real Google Calendar and display actual events, follow these steps:

### 1. Get Google Calendar API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create credentials (API Key)
5. Restrict the API key to Google Calendar API only

### 2. Configure Environment Variables

**Important**: Never commit your `.env` file to version control!

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update your `.env` file with your real API key:

```bash
# Replace with your actual Google API key
VITE_GOOGLE_API_KEY=your_actual_google_api_key_here

# Optional: Use a specific public calendar ID
VITE_GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
```

3. The `.env` file is automatically ignored by git to protect your API keys.

### 3. Using Public Calendars

The app can connect to any public Google Calendar. To use a public calendar:

1. Get the Calendar ID from Google Calendar settings
2. Ensure the calendar is public
3. Update the `PUBLIC_CALENDAR_ID` in `src/services/googleCalendarService.js`

Example public calendar IDs you could use:
- `en.swiss#holiday@group.v.calendar.google.com` (Swiss holidays)
- Or create your own public Werewolf events calendar

### 4. Multiple Calendar Support

The service supports fetching from multiple calendars. Edit the `getKnownWerewolfCalendars()` method to add more calendar sources.

## Features

✅ **Automatic Fallback**: If Google API fails, shows mock events
✅ **Real-time Refresh**: Manual refresh button to update events
✅ **Event Details**: Full event information from Google Calendar
✅ **Multiple Views**: List and calendar grid views
✅ **French Localization**: All text in French
✅ **Status Indicator**: Shows if connected to real Google Calendar or using demo data

## Current Mock Events

The application shows 5 realistic Werewolf events:

1. **Partie de Loups-Garous - Débutants** (Tomorrow)
   - Location: Café des Jeux, Lausanne
   - Beginner-friendly game session

2. **Tournoi de Loups-Garous - Édition Printemps** (In 3 days)
   - Location: Centre Culturel, Lausanne
   - Monthly tournament with prizes

3. **Soirée Loups-Garous Thématique : Nouvelle Lune** (In 6 days)
   - Location: Bar à Jeux Le Gobelin, Genève
   - New expansion theme night

4. **Formation Maître du Jeu - Niveau Avancé** (In 9 days)
   - Location: École de Jeu, Bern
   - Advanced game master training

5. **Convention Loups-Garous Suisse** (In 14 days)
   - Location: Palais des Expositions, Zürich
   - Major Swiss Werewolf convention

## Technical Implementation

- **Service**: `src/services/googleCalendarService.js`
- **Component**: `src/components/Calendar/ModernCalendar.jsx`
- **API**: Google Calendar API v3
- **Fallback**: Comprehensive mock data system
- **Error Handling**: Graceful degradation to demo mode
