import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';

// Set up the localizer for react-big-calendar
moment.locale('fr');
const localizer = momentLocalizer(moment);

const ModernCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('list'); // 'month', 'week', 'day', 'list'

  useEffect(() => {
    // Load demo events
    try {
      const mockEvents = [
        {
          id: '1',
          summary: 'Partie de Loups-Garous',
          description: 'Venez participer à une partie de Loups-Garous!',
          location: 'Salle de jeux',
          start: { dateTime: new Date(Date.now() + 86400000).toISOString() }, // tomorrow
          end: { dateTime: new Date(Date.now() + 86400000 + 7200000).toISOString() }, // tomorrow + 2 hours
          htmlLink: 'https://calendar.google.com/calendar/event?eid=example'
        },
        {
          id: '2',
          summary: 'Tournoi de Loups-Garous',
          description: 'Grand tournoi de Loups-Garous avec prix à gagner!',
          location: 'Centre de loisirs',
          start: { dateTime: new Date(Date.now() + 172800000).toISOString() }, // day after tomorrow
          end: { dateTime: new Date(Date.now() + 172800000 + 14400000).toISOString() }, // day after tomorrow + 4 hours
          htmlLink: 'https://calendar.google.com/calendar/event?eid=example2'
        },
        {
          id: '3',
          summary: 'Initiation aux Loups-Garous',
          description: 'Séance d\'initiation pour les débutants',
          location: 'Bibliothèque municipale',
          start: { dateTime: new Date(Date.now() + 432000000).toISOString() }, // 5 days from now
          end: { dateTime: new Date(Date.now() + 432000000 + 5400000).toISOString() }, // 5 days from now + 1.5 hours
          htmlLink: 'https://calendar.google.com/calendar/event?eid=example3'
        }
      ];

      // Transform mock events to react-big-calendar format
      const formattedEvents = mockEvents.map(event => ({
        id: event.id,
        title: event.summary,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        description: event.description,
        location: event.location,
        allDay: !event.start.dateTime,
        htmlLink: event.htmlLink
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
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
          <h3>Aucun événement à venir</h3>
          <p>Il n'y a pas d'événements planifiés pour le moment.</p>
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
            <button className="btn btn-sm" onClick={(e) => {
              e.stopPropagation();
              addToCalendar(event);
            }}>
              Ajouter à mon calendrier
            </button>
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
          {selectedEvent.description && (
            <div className="event-modal-description">
              <strong>Description:</strong>
              <p>{selectedEvent.description}</p>
            </div>
          )}
          <div className="event-modal-actions">
            <button className="btn" onClick={() => addToCalendar(selectedEvent)}>
              Ajouter à mon calendrier
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Toggle between calendar views
  const toggleView = (newView) => {
    setView(newView);
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