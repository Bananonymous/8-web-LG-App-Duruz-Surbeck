import { useState, useEffect } from 'react';
import axios from 'axios';
import './MJPage.css';

const GameSetup = ({ onComplete }) => {
  const [variants, setVariants] = useState([]);
  const [cards, setCards] = useState([]);
  const [variantCards, setVariantCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [selectedVariant, setSelectedVariant] = useState('base');
  const [playerCount, setPlayerCount] = useState(5);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showBaseCards, setShowBaseCards] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');

  // Fetch variants and cards
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch variants
        const variantsResponse = await axios.get('http://localhost:5000/api/variants');
        setVariants(variantsResponse.data);

        // Fetch base game cards
        const cardsResponse = await axios.get('http://localhost:5000/api/cards');
        setCards(cardsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch variant cards when variant changes
  useEffect(() => {
    const fetchVariantCards = async () => {
      if (selectedVariant === 'base') {
        setVariantCards([]);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/variant-cards?variant_id=${selectedVariant}`);
        setVariantCards(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching variant cards:', error);
        setError('Erreur lors du chargement des cartes de variante');
        setLoading(false);
      }
    };

    fetchVariantCards();
  }, [selectedVariant]);

  // Handle variant change
  const handleVariantChange = (e) => {
    setSelectedVariant(e.target.value);
    setSelectedCards([]);
  };

  // Handle player count change
  const handlePlayerCountChange = (e) => {
    setPlayerCount(parseInt(e.target.value));
  };

  // Handle card selection
  const handleCardSelection = (card) => {
    // Count how many of this card type we already have
    const existingCount = selectedCards.filter(c => c.id === card.id && c.type === card.type).length;

    // Generate a stable instance ID based on card type, id, and instance number
    const cardInstanceId = `${card.type}-${card.id}-instance-${existingCount}`;

    // Add the card with a stable instance ID
    setSelectedCards([...selectedCards, {
      ...card,
      instanceId: cardInstanceId
    }]);
  };

  // Handle card removal
  const handleCardRemoval = (instanceId) => {
    setSelectedCards(selectedCards.filter(card => card.instanceId !== instanceId));
  };

  // Handle removing all cards
  const handleRemoveAllCards = () => {
    setSelectedCards([]);
  };

  // Count how many of this card are selected
  const getCardCount = (card) => {
    return selectedCards.filter(c => c.id === card.id && c.type === card.type).length;
  };

  // Validate game setup
  const validateSetup = () => {
    if (selectedCards.length === 0) {
      setError('Veuillez sélectionner au moins une carte');
      return false;
    }

    if (selectedCards.length < playerCount) {
      setError('Le nombre de cartes doit être au moins égal au nombre de joueurs');
      return false;
    }

    // Check werewolf ratio
    const werewolfCount = selectedCards.filter(card =>
      (card.type === 'base' && cards.find(c => c.id === card.id)?.team === 'Loups-Garous') ||
      (card.type === 'variant' && variantCards.find(c => c.id === card.id)?.team === 'Loups-Garous')
    ).length;

    const villagerCount = selectedCards.length - werewolfCount;

    if (werewolfCount > selectedCards.length / 4) {
      setShowWarning(true);
      return true; // Still allow to continue
    }

    if (werewolfCount === 0) {
      setError('Il doit y avoir au moins un Loup-Garou dans la partie');
      return false;
    }

    setShowWarning(false);
    return true;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (validateSetup()) {
      onComplete({
        variant: selectedVariant === 'base' ? null : selectedVariant,
        playerCount,
        selectedCards
      });
    }
  };

  if (loading && (!cards.length || !variants.length)) {
    return <div className="loading">Chargement des données...</div>;
  }

  // Get available cards based on selected variant and showBaseCards option
  let availableCards = [];

  if (selectedVariant === 'base') {
    // Base game - only show base cards
    availableCards = cards.map(card => ({ ...card, type: 'base' }));
  } else {
    // Variant selected
    if (showBaseCards) {
      // Show both base and variant cards
      availableCards = [
        ...cards.map(card => ({ ...card, type: 'base' })),
        ...variantCards.map(card => ({ ...card, type: 'variant' }))
      ];
    } else {
      // Show only variant cards
      availableCards = variantCards.map(card => ({ ...card, type: 'variant' }));
    }
  }

  // Define team order for sorting
  const teamOrder = {
    'Village': 1,
    'Loups-Garous': 2,
    'Solitaire': 3,
    'Seul': 3  // Same priority as Solitaire
  };

  // Sort cards by team
  availableCards.sort((a, b) => {
    // First sort by team order
    const teamOrderA = teamOrder[a.team] || 999; // Default high value for unknown teams
    const teamOrderB = teamOrder[b.team] || 999;

    if (teamOrderA !== teamOrderB) {
      return teamOrderA - teamOrderB;
    }

    // If same team, sort alphabetically by name
    return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
  });

  return (
    <div className="mj-card">
      <h2>Configuration de la partie</h2>

      {error && <div className="mj-error">{error}</div>}
      {showWarning && (
        <div className="mj-warning">
          Attention : Le ratio de Loups-Garous est supérieur à 1/4 des joueurs, ce qui peut déséquilibrer la partie.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mj-form-group">
          <label htmlFor="variant">Variante</label>
          <select
            id="variant"
            value={selectedVariant}
            onChange={handleVariantChange}
          >
            <option value="base">Jeu de base</option>
            {variants.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </select>
        </div>

        {selectedVariant !== 'base' && (
          <div className="mj-form-group mj-checkbox-container">
            <label className="mj-checkbox-label">
              <input
                type="checkbox"
                checked={showBaseCards}
                onChange={() => setShowBaseCards(!showBaseCards)}
                className="mj-checkbox"
              />
              Inclure les cartes du jeu de base
            </label>
          </div>
        )}

        <div className="mj-form-group">
          <label htmlFor="playerCount">Nombre de joueurs</label>
          <input
            type="number"
            id="playerCount"
            min="3"
            max="30"
            value={playerCount}
            onChange={handlePlayerCountChange}
          />
        </div>

        <div className="mj-selected-cards">
          <div className="mj-selected-cards-header">
            <h3>Cartes sélectionnées ({selectedCards.length})</h3>
            {selectedCards.length > 0 && (
              <button
                type="button"
                className="mj-btn mj-btn-danger"
                onClick={handleRemoveAllCards}
              >
                Supprimer toutes les cartes
              </button>
            )}
          </div>
          <div className="mj-selected-cards-list">
            {[...selectedCards].sort((a, b) => {
              // Use the same team order as for available cards
              const teamOrderA = teamOrder[a.team] || 999;
              const teamOrderB = teamOrder[b.team] || 999;

              if (teamOrderA !== teamOrderB) {
                return teamOrderA - teamOrderB;
              }

              // If same team, sort alphabetically by name
              return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
            }).map(card => (
              <div key={card.instanceId} className="mj-selected-card">
                <img
                  src={card.image_url || '/images/defaut.png'}
                  alt={card.name}
                  className="mj-selected-card-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/defaut.png';
                  }}
                />
                <span className="mj-selected-card-name">{card.name}</span>
                <span className={`mj-card-team-small ${(card.team === 'Seul' ? 'solitaire' : card.team.toLowerCase()).replace(/[^a-z0-9]/g, '-')}`}>
                  {card.team === 'Seul' ? 'Solitaire' : card.team}
                </span>
                {card.type === 'variant' && (
                  <span className="mj-card-variant-badge-small">Variante</span>
                )}
                <button
                  type="button"
                  className="mj-selected-card-remove"
                  onClick={() => handleCardRemoval(card.instanceId)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mj-form-group">
          <label>Cartes disponibles</label>

          <div className="mj-card-filters">
            <div className="mj-search-container">
              <input
                type="text"
                placeholder="Rechercher une carte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mj-search-input"
              />
              {searchTerm && (
                <button
                  className="mj-search-clear"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="mj-team-filter"
            >
              <option value="all">Toutes les équipes</option>
              <option value="Village">Village</option>
              <option value="Loups-Garous">Loups-Garous</option>
              <option value="Solitaire">Solitaire</option>
            </select>
          </div>

          <div className="mj-card-selection">
            {(() => {
              // Group cards by team
              let currentTeam = null;
              const result = [];

              // Filter cards based on search term and team filter
              const filteredCards = availableCards.filter(card => {
                // Apply search filter
                const matchesSearch = searchTerm === '' ||
                  card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  card.description.toLowerCase().includes(searchTerm.toLowerCase());

                // Apply team filter
                const matchesTeam = teamFilter === 'all' ||
                  (teamFilter === 'Solitaire' && card.team === 'Seul') ||
                  card.team === teamFilter;

                return matchesSearch && matchesTeam;
              });

              // If no cards match the filters, show a message
              if (filteredCards.length === 0) {
                result.push(
                  <div key="no-results" className="mj-no-results">
                    Aucune carte ne correspond à votre recherche.
                  </div>
                );
                return result;
              }

              filteredCards.forEach(card => {
                const team = card.team;

                // If we're starting a new team section, add a team header
                if (team !== currentTeam) {
                  currentTeam = team;
                  const displayTeam = team === 'Seul' ? 'Solitaire' : team;

                  // Add a separator if this isn't the first team
                  if (result.length > 0) {
                    result.push(
                      <div key={`separator-${team}`} className="mj-team-separator"></div>
                    );
                  }

                  // Add the team header
                  result.push(
                    <div key={`header-${team}`} className="mj-team-header">
                      <h3 className={`mj-team-title ${(team === 'Seul' ? 'solitaire' : team.toLowerCase()).replace(/[^a-z0-9]/g, '-')}`}>
                        {displayTeam}
                      </h3>
                    </div>
                  );
                }

                // Add the card
                result.push(
                  <div
                    key={`${card.type}-${card.id}`}
                    className="mj-card-item"
                    onClick={() => handleCardSelection(card)}
                  >
                    <img
                      src={card.image_url || '/images/defaut.png'}
                      alt={card.name}
                      className="mj-card-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/defaut.png';
                      }}
                    />
                    <div className="mj-card-item-header">
                      <h3>{card.name}</h3>
                      <span className={`mj-card-team ${(card.team === 'Seul' ? 'solitaire' : card.team.toLowerCase()).replace(/[^a-z0-9]/g, '-')}`}>
                        {card.team === 'Seul' ? 'Solitaire' : card.team}
                      </span>
                    </div>
                    {card.type === 'variant' && (
                      <span className="mj-card-variant-badge">Variante</span>
                    )}
                    {getCardCount(card) > 0 && (
                      <div className="mj-card-count">
                        {getCardCount(card)}
                      </div>
                    )}
                  </div>
                );
              });

              return result;
            })()}
          </div>
        </div>

        <div className="mj-actions">
          <button type="submit" className="mj-btn">
            Continuer
          </button>
        </div>
      </form >
    </div >
  );
};

export default GameSetup;
