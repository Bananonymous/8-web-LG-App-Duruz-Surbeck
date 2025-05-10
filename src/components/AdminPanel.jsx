import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminPanel.css';

// Sous-composants pour l'administration
const AdminHome = () => {
  return (
    <div className="admin-home">
      <h2>Panneau d'Administration</h2>
      <p>Bienvenue dans le panneau d'administration. Utilisez les liens ci-dessous pour gérer le contenu du site.</p>

      <div className="admin-links">
        <Link to="/admin/cards" className="btn">
          Gérer les Cartes
        </Link>
        <Link to="/admin/events" className="btn">
          Gérer les Événements
        </Link>
      </div>
    </div>
  );
};

// Gestion des cartes
const CardManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/cards');
        setCards(response.data);
        setLoading(false);
      } catch (error) {
        setError('Erreur lors du chargement des cartes');
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/cards/${id}`);
        setCards(cards.filter(card => card.id !== id));
      } catch (error) {
        setError('Erreur lors de la suppression de la carte');
      }
    }
  };

  if (loading) {
    return <div className="loading">Chargement des cartes...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="admin-cards">
      <div className="admin-header">
        <h2>Gestion des Cartes</h2>
        <Link to="/admin/cards/new" className="btn btn-add">
          Ajouter une Carte
        </Link>
      </div>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Équipe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.id}>
                <td>{card.id}</td>
                <td>{card.name}</td>
                <td>{card.team}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/admin/cards/edit/${card.id}`)}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(card.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Formulaire de carte (ajout/modification)
const CardForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    team: '',
    description: '',
    lore: '',
    image_url: '',
    is_custom: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isEditMode = window.location.pathname.includes('/edit/');
  const cardId = isEditMode ? window.location.pathname.split('/').pop() : null;

  useEffect(() => {
    if (isEditMode && cardId) {
      const fetchCard = async () => {
        try {
          setLoading(true);
          console.log(`Fetching card with ID: ${cardId}`);
          const response = await axios.get(`http://localhost:5000/api/cards/${cardId}`);
          console.log('Card data received:', response.data);

          if (response.data) {
            const cardData = { ...response.data };

            // Convert is_custom from 0/1 to boolean if needed
            if (typeof cardData.is_custom === 'number') {
              cardData.is_custom = Boolean(cardData.is_custom);
            }

            // Strip the path from the image URL if it exists
            if (cardData.image_url && cardData.image_url.startsWith('/images/')) {
              cardData.image_url = cardData.image_url.replace('/images/', '');
            }

            console.log('Processed card data:', cardData);
            setFormData(cardData);
          } else {
            setError('Données de carte non trouvées');
          }
        } catch (error) {
          console.error('Error fetching card:', error);
          setError('Erreur lors du chargement de la carte');
        } finally {
          setLoading(false);
        }
      };

      fetchCard();
    }
  }, [isEditMode, cardId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Prepare data with proper image path
      const cardData = { ...formData };

      // If image_url is provided, prepend the path
      if (cardData.image_url && cardData.image_url.trim() !== '') {
        // Check if the user already included the path
        if (!cardData.image_url.startsWith('/images/')) {
          cardData.image_url = `/images/${cardData.image_url}`;
        }
      }

      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/cards/${cardId}`, cardData);
      } else {
        await axios.post('http://localhost:5000/api/cards', cardData);
      }

      navigate('/admin/cards');
    } catch (error) {
      setError('Erreur lors de l\'enregistrement de la carte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">
        {isEditMode ? 'Modifier la Carte' : 'Ajouter une Carte'}
      </h2>

      {error && (
        <div className="error-message">
          <i className="error-icon">⚠️</i> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">Nom</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="team" className="form-label">Équipe</label>
          <select
            id="team"
            name="team"
            className="form-select"
            value={formData.team}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner une équipe</option>
            <option value="Village">Village</option>
            <option value="Loups-Garous">Loups-Garous</option>
            <option value="Solitaire">Solitaire</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lore" className="form-label">Histoire (optionnel)</label>
          <textarea
            id="lore"
            name="lore"
            className="form-textarea"
            value={formData.lore || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="image_url" className="form-label">Nom de l'image (optionnel)</label>
          <input
            type="text"
            id="image_url"
            name="image_url"
            className="form-input"
            placeholder="exemple: loup-garou.png"
            value={formData.image_url || ''}
            onChange={handleChange}
          />
          <small className="form-help">Entrez seulement le nom du fichier, pas le chemin complet.</small>
          {formData.image_url && (
            <div className="image-preview">
              <p>Aperçu de l'image:</p>
              <img
                src={formData.image_url ? `/images/${formData.image_url}` : '/images/defaut.png'}
                alt="Aperçu"
                className="preview-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/defaut.png';
                }}
              />
            </div>
          )}
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_custom"
              checked={formData.is_custom}
              onChange={handleChange}
            />
            Carte personnalisée
          </label>
          <p className="checkbox-help">Cochez cette case si cette carte est une création personnalisée et non une carte officielle du jeu.</p>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/cards')}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

// Gestion des événements
const EventManager = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events');
        setEvents(response.data);
        setLoading(false);
      } catch (error) {
        setError('Erreur lors du chargement des événements');
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/events/${id}`);
        setEvents(events.filter(event => event.id !== id));
      } catch (error) {
        setError('Erreur lors de la suppression de l\'événement');
      }
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) {
    return <div className="loading">Chargement des événements...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="admin-events">
      <div className="admin-header">
        <h2>Gestion des Événements</h2>
        <Link to="/admin/events/new" className="btn btn-add">
          Ajouter un Événement
        </Link>
      </div>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td>{event.id}</td>
                <td>{event.title}</td>
                <td>{formatDate(event.date)}</td>
                <td>{event.location}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/admin/events/edit/${event.id}`)}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(event.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Composant principal du panneau d'administration
const AdminPanel = () => {
  return (
    <div className="admin-panel">
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/cards" element={<CardManager />} />
        <Route path="/cards/new" element={<CardForm />} />
        <Route path="/cards/edit/:id" element={<CardForm />} />
        <Route path="/events" element={<EventManager />} />
        <Route path="/events/new" element={<EventForm />} />
        <Route path="/events/edit/:id" element={<EventForm />} />
      </Routes>
    </div>
  );
};

// Formulaire d'événement (ajout/modification)
const EventForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isEditMode = window.location.pathname.includes('/edit/');
  const eventId = isEditMode ? window.location.pathname.split('/').pop() : null;

  useEffect(() => {
    if (isEditMode && eventId) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          console.log(`Fetching event with ID: ${eventId}`);
          const response = await axios.get(`http://localhost:5000/api/events/${eventId}`);
          console.log('Event data received:', response.data);

          if (response.data) {
            // Formater la date pour l'input date
            const event = { ...response.data };
            if (event.date) {
              const date = new Date(event.date);
              event.date = date.toISOString().split('T')[0];
            }

            console.log('Processed event data:', event);
            setFormData(event);
          } else {
            setError('Données d\'événement non trouvées');
          }
        } catch (error) {
          console.error('Error fetching event:', error);
          setError('Erreur lors du chargement de l\'événement');
        } finally {
          setLoading(false);
        }
      };

      fetchEvent();
    }
  }, [isEditMode, eventId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/events/${eventId}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/events', formData);
      }

      navigate('/admin/events');
    } catch (error) {
      setError('Erreur lors de l\'enregistrement de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">
        {isEditMode ? 'Modifier l\'Événement' : 'Ajouter un Événement'}
      </h2>

      {error && (
        <div className="error-message">
          <i className="error-icon">⚠️</i> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title" className="form-label">Titre</label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-input"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date" className="form-label">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            className="form-input"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="location" className="form-label">Lieu</label>
          <input
            type="text"
            id="location"
            name="location"
            className="form-input"
            value={formData.location || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            value={formData.description || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/events')}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPanel;
