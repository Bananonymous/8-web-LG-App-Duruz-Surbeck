import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VariantCardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCardAndVariant = async () => {
      try {
        // Fetch card details
        const cardResponse = await axios.get(`http://localhost:5000/api/variant-cards/${id}`);
        setCard(cardResponse.data);

        // Fetch variant details
        const variantResponse = await axios.get(`http://localhost:5000/api/variants/${cardResponse.data.variant_id}`);
        setVariant(variantResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchCardAndVariant();
  }, [id]);

  const handleBackClick = () => {
    if (variant) {
      navigate(`/variants/${variant.id}`);
    } else {
      navigate('/');
    }
  };

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
            <span className="card-detail-team">{card.team}</span>
            {variant && (
              <span className="card-detail-variant">{variant.name}</span>
            )}
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
        <button className="btn" onClick={handleBackClick}>
          Retour à la variante
        </button>
      </div>
    </div>
  );
};

export default VariantCardDetail;
