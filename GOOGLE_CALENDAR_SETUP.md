# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration for the French Werewolf application.

## Setting up Google Calendar Integration

To connect to a Google Calendar and display actual events, follow these steps:

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

## Features

- Real-time events from Google Calendar
- Event details view with location and description
- List and calendar grid views
- French localization
- Google Calendar integration
- Error handling with fallback

## Technical Implementation

- **Service**: `src/services/googleCalendarService.js`
- **Component**: `src/components/Calendar/ModernCalendar.jsx`
- **API**: Google Calendar API v3
