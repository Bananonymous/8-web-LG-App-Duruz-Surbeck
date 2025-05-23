import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VariantList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [variant, setVariant] = useState(null);
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    team: 'all'
  });

  useEffect(() => {
    const fetchVariantAndCards = async () => {
      try {
        setLoading(true);

        // Fetch variant details
        const variantResponse = await axios.get(`http://localhost:5000/api/variants/${id}`);
        setVariant(variantResponse.data);

        // Fetch variant cards
        const cardsResponse = await axios.get(`http://localhost:5000/api/variant-cards?variant_id=${id}`);
        setCards(cardsResponse.data);
        setFilteredCards(cardsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchVariantAndCards();
  }, [id]);

  // Filter cards when search term or filters change
  useEffect(() => {
    if (!cards.length) return;

    let result = [...cards];

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(card =>
        card.name.toLowerCase().includes(term) ||
        card.description.toLowerCase().includes(term) ||
        (card.lore && card.lore.toLowerCase().includes(term))
      );
    }

    // Apply team filter
    if (filters.team !== 'all') {
      result = result.filter(card => card.team === filters.team);
    }

    setFilteredCards(result);
  }, [searchTerm, filters, cards]);

  const handleCardClick = (cardId) => {
    navigate(`/variant-cards/${cardId}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoreClick = () => {
    navigate(`/variants/${id}/lore`);
  };

  if (loading) {
    return <div className="loading">Chargement des données...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!variant) {
    return <div className="not-found">Variante non trouvée</div>;
  }

  // Get unique teams for filter dropdown
  const teams = ['all', ...new Set(cards.map(card => card.team))];

  return (
    <div className="cards-container">
      <div className="cards-header">
        <h1>{variant.name}</h1>
        <p className="cards-subtitle">{variant.description}</p>
        <button className="btn btn-secondary" onClick={handleLoreClick}>
          Lore / Histoire
        </button>
      </div>

      <div className="cards-filters">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher une carte..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="team-filter">Équipe:</label>
            <select
              id="team-filter"
              name="team"
              className="filter-select"
              value={filters.team}
              onChange={handleFilterChange}
            >
              {teams.map(team => (
                <option key={team} value={team}>
                  {team === 'all' ? 'Toutes les équipes' : team}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card-grid">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="card-item"
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-image-container">
              <img
                src={card.image_url || '/images/defaut.png'}
                alt={card.name}
                className="card-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/defaut.png';
                }}
              />
              <span className="variant-badge">Variante</span>
            </div>
            <div className="card-content">
              <h3 className="card-title">{card.name}</h3>
            </div>
          </div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="no-results">
          <p>Aucune carte ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
};

export default VariantList;
