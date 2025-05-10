import { useState, useEffect } from 'react';
import { Calendar as ReactCalendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events');
        setEvents(response.data);
        setLoading(false);
      } catch (error) {
        setError('Erreur lors du chargement des événements');
        setLoading(false);
        console.error('Erreur:', error);
      }
    };

    fetchEvents();
  }, []);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Fonction pour vérifier si une date a des événements
  const hasEvents = (date) => {
    return events.some(event => {
      const eventDate = new Date(event.date);
      return (
        date.getDate() === eventDate.getDate() &&
        date.getMonth() === eventDate.getMonth() &&
        date.getFullYear() === eventDate.getFullYear()
      );
    });
  };

  // Fonction pour obtenir les événements d'une date spécifique
  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        date.getDate() === eventDate.getDate() &&
        date.getMonth() === eventDate.getMonth() &&
        date.getFullYear() === eventDate.getFullYear()
      );
    });
  };

  // Personnalisation de l'affichage des tuiles du calendrier
  const tileClassName = ({ date, view }) => {
    if (view === 'month' && hasEvents(date)) {
      return 'has-events';
    }
  };

  if (loading) {
    return <div className="loading">Chargement du calendrier...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>Calendrier des Événements</h1>
        <p>Découvrez les prochaines parties de Loups-Garous organisées</p>
      </div>
      
      <ReactCalendar
        onChange={setDate}
        value={date}
        locale="fr-FR"
        tileClassName={tileClassName}
      />
      
      <div className="events-list">
        <h2>Événements à venir</h2>
        {events.length === 0 ? (
          <p>Aucun événement prévu pour le moment.</p>
        ) : (
          events
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .filter(event => new Date(event.date) >= new Date())
            .map(event => (
              <div key={event.id} className="event-item">
                <p className="event-date">{formatDate(event.date)}</p>
                <h3 className="event-title">{event.title}</h3>
                {event.location && <p className="event-location">{event.location}</p>}
                <p>{event.description}</p>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Calendar;
