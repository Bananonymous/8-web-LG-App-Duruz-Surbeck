import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
      <button onClick={() => navigate('/cards')} className="back-button">
        &larr; Retour aux cartes
      </button>

      <div className="card-container">
        <div className="card-image">
          <img 
            src={card.image ? `/images/${card.image}` : '/images/defaut.png'} 
            alt={card.name} 
          />
        </div>

        <div className="card-info">
          <h1>{card.name}</h1>
          <div className="card-meta">
            <span className="team">Équipe: {card.team}</span>
            {card.wakes_up_at_night !== null && (
              <span className="wakes-up">
                Se réveille la nuit: {card.wakes_up_at_night ? 'Oui' : 'Non'}
              </span>
            )}
          </div>

          <div className="card-description">
            <h2>Description</h2>
            <p>{card.description || 'Aucune description disponible'}</p>
          </div>

          <div className="card-power">
            <h2>Pouvoir</h2>
            <p>{card.power || 'Aucun pouvoir spécifique'}</p>
          </div>

          {card.special_rules && (
            <div className="card-special-rules">
              <h2>Règles spéciales</h2>
              <p>{card.special_rules}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDetail;