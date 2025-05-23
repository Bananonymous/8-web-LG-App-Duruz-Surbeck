import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CardDetail.css';

const CardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCard = async () => {
      try {
        // Fetch card details
        const response = await axios.get(`http://localhost:5000/api/cards/${id}`);
        setCard(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching card data:', error);
        setError('Erreur lors du chargement des données de la carte');
        setLoading(false);
      }
    };

    fetchCard();
  }, [id]);

  // Get team class name for styling
  const getTeamClassName = (team) => {
    if (!team) return '';
    if (team === 'Seul') return 'solitaire';
    return team.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };

  if (loading) {
    return <div className="loading">Chargement en cours...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!card) {
    return <div className="not-found">Carte non trouvée</div>;
  }

  return (
    <div className="card-detail">
      <div className="card-detail-header">
        <img
          src={card.image_url || '/images/defaut.png'}
          alt={card.name}
          className="card-detail-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/defaut.png';
          }}
        />
        <div className="card-detail-info">
          <h1>{card.name}</h1>
          <div className="card-detail-badges">
            <span className={`card-detail-team ${getTeamClassName(card.team)}`}>
              {card.team === 'Seul' ? 'Solitaire' : card.team}
            </span>
            <span className={card.is_custom ? "card-detail-custom" : "card-detail-official"}>
              {card.is_custom ? 'Carte personnalisée' : 'Jeu de base'}
            </span>
          </div>
        </div>
      </div>

      <div className="card-detail-section">
        <h2>Description</h2>
        <p>{card.description || 'Aucune description disponible'}</p>
      </div>

      {card.lore && (
        <div className="card-detail-section">
          <h2>Histoire</h2>
          <p>{card.lore}</p>
        </div>
      )}

      {(card.wakes_up_at_night || card.wakes_up_every_night) && (
        <div className="card-detail-section">
          <h2>Réveil nocturne</h2>
          <p>
            {card.wakes_up_at_night ? 'Se réveille la nuit' : 'Ne se réveille pas la nuit'}
            {card.wakes_up_every_night && ' à chaque tour'}
            {card.wake_up_frequency && ` (${card.wake_up_frequency})`}
          </p>
        </div>
      )}

      <div className="card-detail-actions">
        <button className="btn" onClick={() => navigate('/cards')}>
          &larr; Retour aux cartes
        </button>
      </div>
    </div>
  );
};

export default CardDetail;
