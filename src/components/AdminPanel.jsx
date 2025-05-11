import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminPanel.css';
import WakeUpOrderConfig from './WakeUpOrderConfig';
import AdminResetCards from './AdminResetCards';
import AdminLogin from './AdminLogin';

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
        <Link to="/admin/variants" className="btn">
          Gérer les Variantes
        </Link>
        <Link to="/admin/wake-up-order" className="btn">
          Ordre de Réveil
        </Link>
      </div>

      <div className="admin-section" style={{ marginTop: '2rem' }}>
        <h3>Maintenance</h3>
        <AdminResetCards />
      </div>
    </div>
  );
};

// Gestion des cartes
const CardManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey(oldKey => oldKey + 1);
  };

  const handleHardRefresh = () => {
    // Force a complete page reload, bypassing the cache
    window.location.reload(true);
  };

  const handleFixIds = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/fix-card-ids');
      console.log('Fix IDs response:', response.data);
      alert(`IDs fixed: ${JSON.stringify(response.data, null, 2)}`);
      // Refresh the data
      setRefreshKey(oldKey => oldKey + 1);
    } catch (error) {
      console.error('Error fixing IDs:', error);
      alert('Error fixing IDs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCards = async () => {
      try {
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await axios.get(`http://localhost:5000/api/cards?_=${timestamp}`);
        console.log('Cards fetched from server:', response.data);
        // Log the first few card IDs to debug
        if (response.data && response.data.length > 0) {
          console.log('First few card IDs from API:', response.data.slice(0, 5).map(c => c.id));
        }
        // Make sure we're not modifying the data in any way
        setCards([...response.data]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cards:', error);
        setError('Erreur lors du chargement des cartes');
        setLoading(false);
      }
    };

    fetchCards();
  }, [refreshKey]); // Add refreshKey as a dependency to trigger refresh

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
        <div className="admin-header-actions">
          <button onClick={handleRefresh} className="btn btn-refresh" disabled={loading}>
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
          <button onClick={handleHardRefresh} className="btn btn-hard-refresh" disabled={loading}>
            Actualiser (Hard)
          </button>
          <button onClick={handleFixIds} className="btn btn-fix-ids" disabled={loading}>
            Réparer les IDs
          </button>
          <Link to="/admin/cards/new" className="btn btn-add">
            Ajouter une Carte
          </Link>
        </div>
      </div>

      <div className="admin-table">
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#333', color: 'white', borderRadius: '5px' }}>
          <strong>Debug Info:</strong> Total cards: {cards.length},
          First few IDs: {cards.slice(0, 5).map(c => c.id).join(', ')}
        </div>
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
    is_custom: false,
    wakes_up_at_night: false,
    wakes_up_every_night: false,
    wake_up_frequency: ''
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
                style={{ backgroundColor: 'white' }} /* Ensure image has white background */
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

        <div className="form-section">
          <h3 className="form-section-title">Informations de jeu (visibles uniquement pour les administrateurs)</h3>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="wakes_up_at_night"
                checked={formData.wakes_up_at_night}
                onChange={handleChange}
              />
              Se réveille la nuit
            </label>
          </div>

          {formData.wakes_up_at_night && (
            <>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="wakes_up_every_night"
                    checked={formData.wakes_up_every_night}
                    onChange={handleChange}
                  />
                  Se réveille chaque nuit
                </label>
              </div>

              {!formData.wakes_up_every_night && (
                <div className="form-group">
                  <label htmlFor="wake_up_frequency" className="form-label">Fréquence de réveil</label>
                  <select
                    id="wake_up_frequency"
                    name="wake_up_frequency"
                    className="form-select"
                    value={formData.wake_up_frequency || ''}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner une fréquence</option>
                    <option value="1rst night only">Première nuit seulement</option>
                    <option value="1/2 nights">Une nuit sur deux</option>
                    <option value="1/3 nights">Une nuit sur trois</option>
                    <option value="1/4 nights">Une nuit sur quatre</option>
                  </select>
                </div>
              )}
            </>
          )}
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

// Gestion des variantes
const VariantManager = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/variants');
        setVariants(response.data);
        setLoading(false);
      } catch (error) {
        setError('Erreur lors du chargement des variantes');
        setLoading(false);
      }
    };

    fetchVariants();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette variante ? Toutes les cartes associées seront également supprimées.')) {
      try {
        await axios.delete(`http://localhost:5000/api/variants/${id}`);
        setVariants(variants.filter(variant => variant.id !== id));
      } catch (error) {
        setError('Erreur lors de la suppression de la variante');
      }
    }
  };

  if (loading) {
    return <div className="loading">Chargement des variantes...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="admin-variants">
      <div className="admin-header">
        <h2>Gestion des Variantes</h2>
        <Link to="/admin/variants/new" className="btn btn-add">
          Ajouter une Variante
        </Link>
      </div>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map(variant => (
              <tr key={variant.id}>
                <td>{variant.id}</td>
                <td>{variant.name}</td>
                <td>{variant.description.substring(0, 50)}...</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/admin/variants/edit/${variant.id}`)}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/admin/variant-cards/${variant.id}`)}
                  >
                    Cartes
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(variant.id)}
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

// Formulaire de variante (ajout/modification)
const VariantForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lore: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isEditMode = window.location.pathname.includes('/edit/');
  const variantId = isEditMode ? window.location.pathname.split('/').pop() : null;

  useEffect(() => {
    if (isEditMode && variantId) {
      const fetchVariant = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:5000/api/variants/${variantId}`);

          if (response.data) {
            const variantData = { ...response.data };

            // Strip the path from the image URL if it exists
            if (variantData.image_url && variantData.image_url.startsWith('/images/')) {
              variantData.image_url = variantData.image_url.replace('/images/', '');
            }

            setFormData(variantData);
          } else {
            setError('Données de variante non trouvées');
          }
        } catch (error) {
          console.error('Error fetching variant:', error);
          setError('Erreur lors du chargement de la variante');
        } finally {
          setLoading(false);
        }
      };

      fetchVariant();
    }
  }, [isEditMode, variantId]);

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
      const variantData = { ...formData };

      // If image_url is provided, prepend the path
      if (variantData.image_url && variantData.image_url.trim() !== '') {
        // Check if the user already included the path
        if (!variantData.image_url.startsWith('/images/')) {
          variantData.image_url = `/images/${variantData.image_url}`;
        }
      }

      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/variants/${variantId}`, variantData);
      } else {
        await axios.post('http://localhost:5000/api/variants', variantData);
      }

      navigate('/admin/variants');
    } catch (error) {
      setError('Erreur lors de l\'enregistrement de la variante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">
        {isEditMode ? 'Modifier la Variante' : 'Ajouter une Variante'}
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
          <label htmlFor="lore" className="form-label">Histoire/Lore (optionnel)</label>
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
            placeholder="exemple: nouvelle-lune.svg"
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

        <div className="form-actions">
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/variants')}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

// Gestion des cartes de variante
const VariantCardManager = () => {
  const [variantCards, setVariantCards] = useState([]);
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const variantId = window.location.pathname.split('/').pop();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch variant details
        const variantResponse = await axios.get(`http://localhost:5000/api/variants/${variantId}`);
        setVariant(variantResponse.data);

        // Fetch variant cards
        const cardsResponse = await axios.get(`http://localhost:5000/api/variant-cards?variant_id=${variantId}`);
        setVariantCards(cardsResponse.data);

        setLoading(false);
      } catch (error) {
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [variantId]);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/variant-cards/${id}`);
        setVariantCards(variantCards.filter(card => card.id !== id));
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

  if (!variant) {
    return <div className="error">Variante non trouvée</div>;
  }

  return (
    <div className="admin-variant-cards">
      <div className="admin-header">
        <h2>Cartes de la variante: {variant.name}</h2>
        <Link to={`/admin/variant-cards/${variantId}/new`} className="btn btn-add">
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
            {variantCards.map(card => (
              <tr key={card.id}>
                <td>{card.id}</td>
                <td>{card.name}</td>
                <td>{card.team}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/admin/variant-cards/${variantId}/edit/${card.id}`)}
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

      <div className="admin-actions">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/admin/variants')}
        >
          Retour aux Variantes
        </button>
      </div>
    </div>
  );
};

// Composant principal du panneau d'administration
const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token validity by making a request to the server
          const response = await axios.get('http://localhost:5000/api/verify-token', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.data.valid) {
            setIsAuthenticated(true);
            setUser(JSON.parse(savedUser));
          } else {
            // Token is invalid, clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          // If there's an error, assume token is invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (data) => {
    setIsAuthenticated(true);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="admin-panel loading">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header-bar">
        <div className="admin-user-info">
          Connecté en tant que: <strong>{user?.username}</strong>
          {user?.is_admin && <span className="admin-badge">Admin</span>}
        </div>
        <button className="admin-logout-btn" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>

      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/cards" element={<CardManager />} />
        <Route path="/cards/new" element={<CardForm />} />
        <Route path="/cards/edit/:id" element={<CardForm />} />
        <Route path="/events" element={<EventManager />} />
        <Route path="/events/new" element={<EventForm />} />
        <Route path="/events/edit/:id" element={<EventForm />} />
        <Route path="/variants" element={<VariantManager />} />
        <Route path="/variants/new" element={<VariantForm />} />
        <Route path="/variants/edit/:id" element={<VariantForm />} />
        <Route path="/variant-cards/:id" element={<VariantCardManager />} />
        <Route path="/variant-cards/:id/new" element={<VariantCardForm />} />
        <Route path="/variant-cards/:id/edit/:cardId" element={<VariantCardForm />} />
        <Route path="/wake-up-order" element={<WakeUpOrderConfig />} />
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

// Formulaire de carte de variante (ajout/modification)
const VariantCardForm = () => {
  const [formData, setFormData] = useState({
    variant_id: '',
    name: '',
    team: '',
    description: '',
    lore: '',
    image_url: '',
    wakes_up_at_night: false,
    wakes_up_every_night: false,
    wake_up_frequency: ''
  });
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get variant ID from URL
  const pathParts = window.location.pathname.split('/');
  const variantId = pathParts[3];

  // Check if we're in edit mode
  const isEditMode = pathParts.includes('edit');
  const cardId = isEditMode ? pathParts[5] : null;

  // Fetch variant details
  useEffect(() => {
    const fetchVariant = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/variants/${variantId}`);
        setVariant(response.data);

        // Set variant_id in form data
        setFormData(prev => ({
          ...prev,
          variant_id: variantId
        }));
      } catch (error) {
        console.error('Error fetching variant:', error);
        setError('Erreur lors du chargement de la variante');
      }
    };

    fetchVariant();
  }, [variantId]);

  // If in edit mode, fetch card details
  useEffect(() => {
    if (isEditMode && cardId) {
      const fetchCard = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:5000/api/variant-cards/${cardId}`);

          if (response.data) {
            const cardData = { ...response.data };

            // Strip the path from the image URL if it exists
            if (cardData.image_url && cardData.image_url.startsWith('/images/')) {
              cardData.image_url = cardData.image_url.replace('/images/', '');
            }

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
        await axios.put(`http://localhost:5000/api/variant-cards/${cardId}`, cardData);
      } else {
        await axios.post('http://localhost:5000/api/variant-cards', cardData);
      }

      navigate(`/admin/variant-cards/${variantId}`);
    } catch (error) {
      setError('Erreur lors de l\'enregistrement de la carte');
    } finally {
      setLoading(false);
    }
  };

  if (!variant) {
    return <div className="loading">Chargement de la variante...</div>;
  }

  return (
    <div className="form-container">
      <h2 className="form-title">
        {isEditMode ? 'Modifier la Carte' : 'Ajouter une Carte'} - Variante: {variant.name}
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
            placeholder="exemple: chaman.svg"
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

        <div className="form-section">
          <h3 className="form-section-title">Informations de jeu (visibles uniquement pour les administrateurs)</h3>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="wakes_up_at_night"
                checked={formData.wakes_up_at_night}
                onChange={handleChange}
              />
              Se réveille la nuit
            </label>
          </div>

          {formData.wakes_up_at_night && (
            <>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="wakes_up_every_night"
                    checked={formData.wakes_up_every_night}
                    onChange={handleChange}
                  />
                  Se réveille chaque nuit
                </label>
              </div>

              {!formData.wakes_up_every_night && (
                <div className="form-group">
                  <label htmlFor="wake_up_frequency" className="form-label">Fréquence de réveil</label>
                  <select
                    id="wake_up_frequency"
                    name="wake_up_frequency"
                    className="form-select"
                    value={formData.wake_up_frequency || ''}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner une fréquence</option>
                    <option value="1rst night only">Première nuit seulement</option>
                    <option value="1/2 nights">Une nuit sur deux</option>
                    <option value="1/3 nights">Une nuit sur trois</option>
                    <option value="1/4 nights">Une nuit sur quatre</option>
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/admin/variant-cards/${variantId}`)}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPanel;
