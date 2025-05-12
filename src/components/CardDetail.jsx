import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CardDetail = () => {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/cards/${id}`);
        setCard(response.data);
        setLoading(false);
      } catch (error) {
        setError('Erreur lors du chargement de la carte');
        setLoading(false);
        console.error('Erreur:', error);
      }
    };

    fetchCard();
  }, [id]);

  if (loading) {
    return <div className="loading">Chargement de la carte...</div>;
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
            <span className="card-detail-team">{card.team === 'Seul' ? 'Solitaire' : card.team}</span>
            {card.is_custom === 1
              ? <span className="card-detail-custom">Carte personnalisée</span>
              : <span className="card-detail-official">Jeu de base</span>
            }
          </div>
        </div>
      </div>

      <div className="card-detail-section">
        <h2>Description</h2>
        <p>{card.description}</p>
      </div>

      {card.lore && (
        <div className="card-detail-section">
          <h2>Histoire</h2>
          <p>{card.lore}</p>
        </div>
      )}

      <div className="card-detail-actions">
        <Link to="/cards" className="btn btn-secondary">
          Retour aux cartes
        </Link>
      </div>
    </div>
  );
};

export default CardDetail;
