import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import googleCalendarService from '../../services/googleCalendarService';

// Set up the localizer for react-big-calendar
moment.locale('fr');
const localizer = momentLocalizer(moment);

const ModernCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('list'); // 'month', 'week', 'day', 'list'
  const [isGoogleCalendar, setIsGoogleCalendar] = useState(false);

  useEffect(() => {
    // Load events from Google Calendar
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Try to fetch from Google Calendar
        const calendarEvents = await googleCalendarService.fetchPublicCalendarEvents();
        setIsGoogleCalendar(import.meta.env.VITE_GOOGLE_API_KEY && import.meta.env.VITE_GOOGLE_API_KEY !== 'AIzaSyDrNGUuFuCaG5xmT0rOSb6LqOiVfM7kR1c');
        
        // Transform events for react-big-calendar
        const formattedEvents = calendarEvents.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          description: event.description,
          location: event.location,
          allDay: event.allDay,
          htmlLink: event.htmlLink,
          creator: event.creator,
          status: event.status
        }));

        setEvents(formattedEvents);
        
        if (formattedEvents.length === 0) {
          console.log('No events found in Google Calendar');
        }
      } catch (error) {
        console.error('Error loading events:', error);
        setError('Erreur lors du chargement des événements du calendrier');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Handle event selection
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  // Close event details modal
  const closeEventDetails = () => {
    setSelectedEvent(null);
  };

  // Add event to user's calendar
  const addToCalendar = (event) => {
    window.open(event.htmlLink, '_blank');
  };

  // Format date for display
  const formatDate = (date) => {
    return moment(date).format('dddd D MMMM YYYY, HH:mm');
  };

  // Custom event component for the calendar
  const EventComponent = ({ event }) => (
    <div className="calendar-event">
      <div className="calendar-event-title">{event.title}</div>
    </div>
  );

  // Render upcoming events list
  const renderUpcomingEvents = () => {
    if (events.length === 0) {
      return (
        <div className="no-events">
          {isGoogleCalendar ? (
            <>
              <h3>Aucun événement trouvé</h3>
              <p>Aucun événement Loups-Garous n'est programmé dans le calendrier Google configuré.</p>
              <p>Vérifiez que le calendrier contient des événements ou contactez l'organisateur.</p>
            </>
          ) : (
            <>
              <h3>Calendrier Google non configuré</h3>
              <p>Pour afficher les vrais événements, configurez votre clé API Google Calendar.</p>
              <p>Consultez le fichier <code>GOOGLE_CALENDAR_SETUP.md</code> pour les instructions.</p>
            </>
          )}
          <button className="btn" onClick={refreshEvents}>
            <i className="fas fa-sync-alt"></i>
            Réessayer
          </button>
        </div>
      );
    }

    return (
      <div className="upcoming-events">
        {events.map(event => (
          <div key={event.id} className="event-card" onClick={() => handleSelectEvent(event)}>
            <div className="event-date">
              {moment(event.start).format('dddd D MMMM')}
              {!event.allDay && (
                <span className="event-time">{moment(event.start).format('HH:mm')}</span>
              )}
            </div>
            <h3 className="event-title">{event.title}</h3>
            {event.location && (
              <div className="event-location">
                <i className="fas fa-map-marker-alt"></i> {event.location}
              </div>
            )}
            {event.htmlLink ? (
              <button className="btn btn-sm" onClick={(e) => {
                e.stopPropagation();
                addToCalendar(event);
              }}>
                <i className="fas fa-external-link-alt"></i>
                Voir dans Google Calendar
              </button>
            ) : (
              <button className="btn btn-sm" disabled>
                <i className="fas fa-calendar"></i>
                Lien non disponible
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render event details modal
  const renderEventDetails = () => {
    if (!selectedEvent) return null;

    return (
      <div className="event-modal-overlay" onClick={closeEventDetails}>
        <div className="event-modal" onClick={e => e.stopPropagation()}>
          <button className="close-button" onClick={closeEventDetails}>×</button>
          <h2>{selectedEvent.title}</h2>
          <div className="event-modal-date">
            {selectedEvent.allDay ? (
              <p>{formatDate(selectedEvent.start).split(',')[0]}</p>
            ) : (
              <p>{formatDate(selectedEvent.start)} - {moment(selectedEvent.end).format('HH:mm')}</p>
            )}
          </div>
          {selectedEvent.location && (
            <div className="event-modal-location">
              <strong>Lieu:</strong> {selectedEvent.location}
            </div>
          )}
          {selectedEvent.creator && (
            <div className="event-modal-creator">
              <strong>Organisé par:</strong> {selectedEvent.creator}
            </div>
          )}
          {selectedEvent.description && (
            <div className="event-modal-description">
              <strong>Description:</strong>
              <p>{selectedEvent.description}</p>
            </div>
          )}
          <div className="event-modal-actions">
            {selectedEvent.htmlLink ? (
              <button className="btn" onClick={() => addToCalendar(selectedEvent)}>
                <i className="fas fa-external-link-alt"></i>
                Voir dans Google Calendar
              </button>
            ) : (
              <button className="btn" disabled>
                <i className="fas fa-calendar"></i>
                Lien non disponible
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Toggle between calendar views
  const toggleView = (newView) => {
    setView(newView);
  };

  // Refresh calendar events
  const refreshEvents = async () => {
    setLoading(true);
    setError('');
    
    try {
      const calendarEvents = await googleCalendarService.fetchPublicCalendarEvents();
      
      const formattedEvents = calendarEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        description: event.description,
        location: event.location,
        allDay: event.allDay,
        htmlLink: event.htmlLink,
        creator: event.creator,
        status: event.status
      }));

      setEvents(formattedEvents);
      
      if (formattedEvents.length === 0) {
        console.log('No events found after refresh');
      }
    } catch (error) {
      console.error('Error refreshing events:', error);
      setError('Erreur lors du rafraîchissement des événements');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        
        <div className="calendar-source-info">
          {isGoogleCalendar ? (
            <div className="calendar-status connected">
              <i className="fas fa-check-circle"></i>
              <span>Connecté au Google Calendar ({events.length} événement{events.length !== 1 ? 's' : ''})</span>
            </div>
          ) : (
            <div className="calendar-status disconnected">
              <i className="fas fa-exclamation-triangle"></i>
              <span>Google Calendar non configuré - Aucun événement affiché</span>
            </div>
          )}
          <button 
            className="refresh-btn" 
            onClick={refreshEvents}
            disabled={loading}
            title="Actualiser les événements"
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            Actualiser
          </button>
        </div>

        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => toggleView('list')}
          >
            Liste
          </button>
          <button
            className={`view-toggle-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => toggleView('month')}
          >
            Calendrier
          </button>
        </div>
      </div>

      {view === 'list' ? (
        renderUpcomingEvents()
      ) : (
        <div className="big-calendar-wrapper">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            views={['month', 'week', 'day']}
            defaultView="month"
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
              event: EventComponent
            }}
            onSelectEvent={handleSelectEvent}
          />
        </div>
      )}

      {renderEventDetails()}
    </div>
  );
};

export default ModernCalendar;