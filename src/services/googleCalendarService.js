const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const PUBLIC_CALENDAR_ID = 'ah514a5j4gd708f6oup8lhorv8@group.calendar.google.com';

class GoogleCalendarService {
  constructor() {
    this.apiKey = GOOGLE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
  }

  async fetchPublicCalendarEvents(calendarId = PUBLIC_CALENDAR_ID, maxResults = 10) {
    try {
      if (!this.apiKey || this.apiKey === '') {
        console.warn('Google API key not configured properly');
        return [];
      }

      const events = await this.tryFetchFromCalendar(calendarId, maxResults);
      return events;
    } catch (error) {
      console.error('Error in fetchPublicCalendarEvents:', error);
      return [];
    }
  }

  async tryFetchFromCalendar(calendarId, maxResults) {
    try {
      const now = new Date().toISOString();
      const timeMax = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)).toISOString();

      const url = `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?` +
        `key=${this.apiKey}&` +
        `timeMin=${now}&` +
        `timeMax=${timeMax}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=${maxResults}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Calendar not found: ${calendarId}`);
        } else {
          console.error(`Google Calendar API error: ${response.status} - ${response.statusText}`);
        }
        return [];
      }

      const data = await response.json();
      return this.transformGoogleEvents(data.items || []);
    } catch (error) {
      console.error(`Error fetching from calendar ${calendarId}:`, error);
      return [];
    }
  }

  transformGoogleEvents(googleEvents) {
    return googleEvents.map(event => ({
      id: event.id,
      title: event.summary || 'Événement sans titre',
      description: event.description || '',
      location: event.location || '',
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
      allDay: !event.start.dateTime,
      htmlLink: event.htmlLink,
      creator: event.creator?.displayName || '',
      status: event.status
    }));
  }
}

export default new GoogleCalendarService();
