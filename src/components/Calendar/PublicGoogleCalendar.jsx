import { useState, useEffect } from 'react';
import './Calendar.css';

const PublicGoogleCalendar = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Calendar URL
  const calendarUrl = 'https://calendar.google.com/calendar/embed?src=ah514a5j4gd708f6oup8lhorv8%40group.calendar.google.com&ctz=Europe%2FZurich';
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    setLoading(false);
  };
  
  // Handle iframe error
  const handleIframeError = () => {
    setError('Erreur lors du chargement du calendrier Google');
    setLoading(false);
  };
  
  useEffect(() => {
    // Set a timeout to handle cases where the iframe might not trigger load/error events
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>Calendrier des Événements</h1>
        <p>Consultez les prochaines parties de Loups-Garous organisées</p>
      </div>
      
      {loading && !error && (
        <div className="loading">Chargement du calendrier...</div>
      )}
      
      {error && (
        <div className="error">
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      )}
      
      <div className={`google-calendar-wrapper ${loading ? 'loading' : ''}`}>
        <iframe
          src={calendarUrl}
          style={{ 
            border: 0,
            width: '100%',
            height: '600px',
            display: loading ? 'none' : 'block'
          }}
          frameBorder="0"
          scrolling="no"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Google Calendar"
        ></iframe>
      </div>
    </div>
  );
};

export default PublicGoogleCalendar;
