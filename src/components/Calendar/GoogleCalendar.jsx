import { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { gapi } from 'gapi-script';
import './Calendar.css';

// Set up the localizer for react-big-calendar
moment.locale('fr');
const localizer = momentLocalizer(moment);

const GoogleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokens, setTokens] = useState(null);

  // Initialize Google API client
  useEffect(() => {
    const initGoogleApi = async () => {
      try {
        await gapi.load('client:auth2', () => {
          gapi.client.init({
            apiKey: 'AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs', // Public API key
            clientId: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com', // Replace with your client ID
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
          });
        });
      } catch (error) {
        console.error('Error initializing Google API:', error);
        setError('Erreur lors de l\'initialisation de l\'API Google');
      }
    };

    initGoogleApi();
  }, []);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      const savedTokens = localStorage.getItem('googleCalendarTokens');
      if (savedTokens) {
        try {
          const parsedTokens = JSON.parse(savedTokens);
          setTokens(parsedTokens);
          setIsAuthenticated(true);
          fetchEvents(parsedTokens.access_token);
        } catch (error) {
          console.error('Error parsing saved tokens:', error);
          localStorage.removeItem('googleCalendarTokens');
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [fetchEvents]);

  // Fetch events from Google Calendar
  const fetchEvents = useCallback(async (accessToken) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/google-calendar/events', {
        params: { accessToken, maxResults: 50 }
      });

      // Transform Google Calendar events to react-big-calendar format
      const formattedEvents = response.data.map(event => ({
        id: event.id,
        title: event.summary,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        description: event.description,
        location: event.location,
        allDay: !event.start.dateTime
      }));

      setEvents(formattedEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response && error.response.status === 404) {
        setError('Erreur: API Google Calendar non disponible. Veuillez vérifier la configuration du serveur.');
      } else {
        setError(`Erreur lors du chargement des événements: ${error.message}`);
      }
      setLoading(false);
    }
  }, []);

  // Handle Google sign-in
  const handleSignIn = async () => {
    try {
      setLoading(true);

      // Get auth URL from our backend
      const authUrlResponse = await axios.get('/api/google-calendar/auth-url');
      const { authUrl } = authUrlResponse.data;

      // Open Google OAuth consent screen
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error during sign in:', error);
      setError('Erreur lors de la connexion à Google Calendar');
      setLoading(false);
    }
  };

  // Handle OAuth callback
  const handleAuthCallback = useCallback(async (code) => {
    try {
      setLoading(true);

      // Exchange code for tokens
      const tokenResponse = await axios.post('/api/google-calendar/auth-callback', { code });
      const { tokens } = tokenResponse.data;

      // Save tokens
      localStorage.setItem('googleCalendarTokens', JSON.stringify(tokens));
      setTokens(tokens);
      setIsAuthenticated(true);

      // Fetch events with the new access token
      await fetchEvents(tokens.access_token);
    } catch (error) {
      console.error('Error handling auth callback:', error);
      setError('Erreur lors de l\'authentification avec Google');
      setLoading(false);
    }
  }, [fetchEvents]);

  // Check for auth code in URL (after OAuth redirect)
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      // Remove code from URL to prevent reusing it
      window.history.replaceState({}, document.title, window.location.pathname);
      handleAuthCallback(code);
    }
  }, [handleAuthCallback]);

  // Handle sign out
  const handleSignOut = () => {
    localStorage.removeItem('googleCalendarTokens');
    setTokens(null);
    setIsAuthenticated(false);
    setEvents([]);
  };

  // Event details component
  const EventDetails = ({ event }) => (
    <div className="event-details">
      <h3>{event.title}</h3>
      {event.location && <p><strong>Lieu:</strong> {event.location}</p>}
      {event.description && <p>{event.description}</p>}
    </div>
  );

  if (loading && !error) {
    return <div className="loading">Chargement du calendrier...</div>;
  }

  if (error) {
    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <h1>Calendrier des Événements</h1>
          <p>Consultez les prochaines parties de Loups-Garous organisées</p>
        </div>
        <div className="error">
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>Calendrier des Événements</h1>
        <p>Consultez les prochaines parties de Loups-Garous organisées</p>

        {isAuthenticated ? (
          <button className="btn btn-secondary" onClick={handleSignOut}>
            Se déconnecter de Google Calendar
          </button>
        ) : (
          <button className="btn" onClick={handleSignIn}>
            Se connecter avec Google Calendar
          </button>
        )}
      </div>

      {isAuthenticated ? (
        <div className="big-calendar-wrapper">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            views={['month', 'week', 'day', 'agenda']}
            messages={{
              today: 'Aujourd\'hui',
              previous: 'Précédent',
              next: 'Suivant',
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Heure',
              event: 'Événement',
              noEventsInRange: 'Aucun événement dans cette période'
            }}
            components={{
              event: EventDetails
            }}
          />
        </div>
      ) : (
        <div className="empty-calendar">
          <div className="empty-state">
            <h2>Aucun événement à afficher</h2>
            <p>Connectez-vous avec Google Calendar pour voir vos événements.</p>
            <button className="btn" onClick={handleSignIn}>
              Se connecter avec Google Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendar;
