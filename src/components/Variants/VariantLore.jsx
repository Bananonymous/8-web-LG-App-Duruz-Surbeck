import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VariantLore = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/variants/${id}`);
        setVariant(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching variant:', error);
        setError('Erreur lors du chargement de la variante');
        setLoading(false);
      }
    };

    fetchVariant();
  }, [id]);

  const handleBackClick = () => {
    navigate(`/variants/${id}`);
  };

  if (loading) {
    return <div className="loading">Chargement de la variante...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!variant) {
    return <div className="not-found">Variante non trouvée</div>;
  }

  return (
    <div className="variant-lore-container">
      <div className="variant-lore-header">
        <h1>{variant.name}</h1>
        <div className="variant-image-container">
          <img
            src={variant.image_url || '/images/defaut.png'}
            alt={variant.name}
            className="variant-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/defaut.png';
            }}
          />
        </div>
      </div>

      <div className="variant-lore-content">
        <h2>Histoire et Lore</h2>
        <div className="variant-lore-text">
          {variant.lore ? (
            <p>{variant.lore}</p>
          ) : (
            <p className="no-lore">Aucune histoire disponible pour cette variante.</p>
          )}
        </div>

        <h2>Description</h2>
        <div className="variant-description">
          <p>{variant.description}</p>
        </div>
      </div>

      <div className="variant-lore-actions">
        <button className="btn" onClick={handleBackClick}>
          Retour aux cartes
        </button>
      </div>
    </div>
  );
};

export default VariantLore;
