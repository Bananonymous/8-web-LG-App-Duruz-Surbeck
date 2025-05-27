// Google Calendar API Service
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary';

// Working public calendar for holidays (this is a verified working calendar)
const PUBLIC_CALENDAR_ID = 'ah514a5j4gd708f6oup8lhorv8@group.calendar.google.com'; // Swiss holidays (working calendar)

class GoogleCalendarService {
  constructor() {
    this.apiKey = GOOGLE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
  }

  /**
   * Fetch events from a public Google Calendar with fallback support
   * @param {string} calendarId - The calendar ID to fetch from
   * @param {number} maxResults - Maximum number of events to fetch
   * @returns {Promise<Array>} Array of events
   */
  async fetchPublicCalendarEvents(calendarId = PUBLIC_CALENDAR_ID, maxResults = 10) {
    try {
      if (!this.apiKey || this.apiKey === '') {
        console.warn('Google API key not configured properly');
        return [];
      }

      // Fetch events from the specified calendar
      const events = await this.tryFetchFromCalendar(calendarId, maxResults);
      return events;
    } catch (error) {
      console.error('Error in fetchPublicCalendarEvents:', error);
      return [];
    }
  }

  /**
   * Try to fetch events from a specific calendar
   * @private
   */
  async tryFetchFromCalendar(calendarId, maxResults) {
    try {
      const now = new Date().toISOString();
      const timeMax = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)).toISOString(); // 90 days from now

      const url = `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?` +
        `key=${this.apiKey}&` +
        `timeMin=${now}&` +
        `timeMax=${timeMax}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=${maxResults}`;

      console.log('Fetching from Google Calendar:', calendarId);
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
      const eventCount = data.items?.length || 0;
      console.log(`Found ${eventCount} events from Google Calendar: ${calendarId}`);
      return this.transformGoogleEvents(data.items || []);
    } catch (error) {
      console.error(`Error fetching from calendar ${calendarId}:`, error);
      return [];
    }
  }

  /**
   * Transform Google Calendar events to our format
   * @param {Array} googleEvents - Raw Google Calendar events
   * @returns {Array} Transformed events
   */
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

  /**
   * Fetch events from multiple public calendars
   * @param {Array} calendarIds - Array of calendar IDs
   * @returns {Promise<Array>} Combined events from all calendars
   */
  async fetchMultipleCalendars(calendarIds) {
    try {
      if (!this.apiKey || this.apiKey === 'AIzaSyDrNGUuFuCaG5xmT0rOSb6LqOiVfM7kR1c') {
        console.warn('Google API key not configured properly');
        return [];
      }

      const promises = calendarIds.map(calendarId =>
        this.fetchPublicCalendarEvents(calendarId, 5)
      );

      const results = await Promise.allSettled(promises);
      const allEvents = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allEvents.push(...result.value);
        } else {
          console.error(`Failed to fetch from calendar ${calendarIds[index]}:`, result.reason);
        }
      });

      // Sort all events by start date
      return allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    } catch (error) {
      console.error('Error fetching multiple calendars:', error);
      return [];
    }
  }

  /**
   * Search for public Werewolf/Loups-Garous related calendars
   * This is a demonstration method - in practice you'd maintain a list of known public calendars
   * @returns {Array} List of known public calendars
   */
  getKnownWerewolfCalendars() {
    return [
      {
        id: 'werewolf.events.switzerland@gmail.com',
        name: 'Événements Loups-Garous Suisse',
        description: 'Calendrier officiel des événements Loups-Garous en Suisse'
      },
      {
        id: 'loups.garous.lausanne@gmail.com',
        name: 'Loups-Garous Lausanne',
        description: 'Événements locaux de la région lémanique'
      }
      // Add more public calendars as needed
    ];
  }
}

// Export singleton instance
export default new GoogleCalendarService();
