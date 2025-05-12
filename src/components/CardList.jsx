import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CardList = () => {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    team: 'all',
    custom: 'all'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/cards');
        setCards(response.data);
        setFilteredCards(response.data);
        setLoading(false);
      } catch (error) {
        setError('Erreur lors du chargement des cartes');
        setLoading(false);
        console.error('Erreur:', error);
      }
    };

    fetchCards();
  }, []);

  useEffect(() => {
    // Filter cards based on search term and filters
    const results = cards.filter(card => {
      // Search term filter
      const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Team filter
      const matchesTeam = filters.team === 'all' || card.team === filters.team;

      // Custom filter
      const matchesCustom =
        filters.custom === 'all' ||
        (filters.custom === 'custom' && card.is_custom === 1) ||
        (filters.custom === 'official' && card.is_custom === 0);

      return matchesSearch && matchesTeam && matchesCustom;
    });

    setFilteredCards(results);
  }, [searchTerm, filters, cards]);

  const handleCardClick = (id) => {
    navigate(`/cards/${id}`);
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

  if (loading) {
    return <div className="loading">Chargement des cartes...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Get unique teams for filter
  const teams = ['all', ...new Set(cards.map(card => card.team))];

  return (
    <div className="cards-container">
      <div className="cards-header">
        <h1>Catalogue des Cartes</h1>
        <p>Découvrez toutes les cartes du jeu Loups-Garous de Thiercelieux</p>

        <div className="cards-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Rechercher une carte..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="team-filter">Équipe:</label>
              <select
                id="team-filter"
                name="team"
                value={filters.team}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">Toutes les équipes</option>
                {teams.filter(team => team !== 'all').map(team => (
                  <option key={team} value={team}>{team === 'Seul' ? 'Solitaire' : team}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="custom-filter">Type:</label>
              <select
                id="custom-filter"
                name="custom"
                value={filters.custom}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">Toutes les cartes</option>
                <option value="official">Cartes officielles</option>
                <option value="custom">Cartes personnalisées</option>
              </select>
            </div>
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
              {card.is_custom === 1
                ? <span className="custom-badge">Carte personnalisée</span>
                : <span className="official-badge">Jeu de base</span>
              }
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

export default CardList;
