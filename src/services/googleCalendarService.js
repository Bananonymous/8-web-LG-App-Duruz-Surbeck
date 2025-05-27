// Google Calendar API Service
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary';

// Public calendar for Werewolf events (example - you can use any public calendar)
const PUBLIC_CALENDAR_ID = 'en.swiss#holiday@group.v.calendar.google.com'; // Example public calendar

class GoogleCalendarService {
  constructor() {
    this.apiKey = GOOGLE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
  }

  /**
   * Fetch events from a public Google Calendar
   * @param {string} calendarId - The calendar ID to fetch from
   * @param {number} maxResults - Maximum number of events to fetch
   * @returns {Promise<Array>} Array of events
   */
  async fetchPublicCalendarEvents(calendarId = PUBLIC_CALENDAR_ID, maxResults = 10) {
    try {
      if (!this.apiKey || this.apiKey === 'AIzaSyDrNGUuFuCaG5xmT0rOSb6LqOiVfM7kR1c') {
        console.warn('Google API key not configured properly');
        return [];
      }

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
        console.error(`Google Calendar API error: ${response.status} - ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log(`Found ${data.items?.length || 0} events from Google Calendar`);
      return this.transformGoogleEvents(data.items || []);
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
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
   * Mock events for demonstration when API is not available
   * @returns {Array} Mock events
   */
  getMockEvents() {
    const now = Date.now();
    return [
      {
        id: 'mock-1',
        title: 'Partie de Loups-Garous - Débutants',
        description: 'Une partie spécialement conçue pour les nouveaux joueurs. Venez découvrir l\'univers mystérieux de Thiercelieux !',
        location: 'Café des Jeux, Rue du Village 12, Lausanne',
        start: new Date(now + 86400000), // tomorrow
        end: new Date(now + 86400000 + 7200000), // tomorrow + 2 hours
        allDay: false,
        htmlLink: 'https://calendar.google.com/calendar/event?eid=mock1',
        creator: 'Association Loups-Garous Lausanne',
        status: 'confirmed'
      },
      {
        id: 'mock-2',
        title: 'Tournoi de Loups-Garous - Édition Printemps',
        description: 'Grand tournoi mensuel avec prix à gagner ! Venez défendre votre village contre les créatures de la nuit.',
        location: 'Centre Culturel, Salle Polyvalente, Lausanne',
        start: new Date(now + 259200000), // 3 days from now
        end: new Date(now + 259200000 + 14400000), // 3 days + 4 hours
        allDay: false,
        htmlLink: 'https://calendar.google.com/calendar/event?eid=mock2',
        creator: 'Fédération Suisse de Loups-Garous',
        status: 'confirmed'
      },
      {
        id: 'mock-3',
        title: 'Soirée Loups-Garous Thématique : Nouvelle Lune',
        description: 'Découvrez les nouvelles cartes et variantes de l\'extension "Nouvelle Lune". Ambiance garantie !',
        location: 'Bar à Jeux Le Gobelin, Genève',
        start: new Date(now + 518400000), // 6 days from now
        end: new Date(now + 518400000 + 10800000), // 6 days + 3 hours
        allDay: false,
        htmlLink: 'https://calendar.google.com/calendar/event?eid=mock3',
        creator: 'Le Gobelin Gaming',
        status: 'confirmed'
      },
      {
        id: 'mock-4',
        title: 'Formation Maître du Jeu - Niveau Avancé',
        description: 'Perfectionnez vos techniques d\'animation et découvrez les secrets des maîtres du jeu expérimentés.',
        location: 'École de Jeu, Bern',
        start: new Date(now + 777600000), // 9 days from now
        end: new Date(now + 777600000 + 21600000), // 9 days + 6 hours
        allDay: false,
        htmlLink: 'https://calendar.google.com/calendar/event?eid=mock4',
        creator: 'École Suisse du Jeu',
        status: 'confirmed'
      },
      {
        id: 'mock-5',
        title: 'Convention Loups-Garous Suisse',
        description: 'Le plus grand rassemblement de joueurs de Loups-Garous en Suisse ! Tournois, démonstrations, et surprises.',
        location: 'Palais des Expositions, Zürich',
        start: new Date(now + 1209600000), // 14 days from now
        end: new Date(now + 1209600000 + 28800000), // 14 days + 8 hours
        allDay: false,
        htmlLink: 'https://calendar.google.com/calendar/event?eid=mock5',
        creator: 'Convention Games CH',
        status: 'confirmed'
      }
    ];
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
