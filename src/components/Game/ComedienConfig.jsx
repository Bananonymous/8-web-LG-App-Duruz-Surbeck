import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ComedienConfig.css';

/**
 * ComedienConfig component
 * Allows configuring the 3 powers for the Comedian role
 */
const ComedienConfig = ({ allCards, onConfigComplete, onCancel, initialPowers = [] }) => {
  // State for selected powers (up to 3)
  const [selectedPowers, setSelectedPowers] = useState(initialPowers.length > 0 ? initialPowers : []);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [includeVariants, setIncludeVariants] = useState(false);

  // State for all available cards from the server
  const [baseCards, setBaseCards] = useState([]);
  const [variantCards, setVariantCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all cards from the server
  useEffect(() => {
    const fetchAllCards = async () => {
      try {
        setLoading(true);

        // Fetch base game cards
        const baseCardsResponse = await axios.get('http://localhost:5000/api/cards');
        const formattedBaseCards = baseCardsResponse.data
          .filter(card => card.name !== 'Comédien') // Filter out the Comedian card itself
          .map(card => ({
            ...card,
            type: 'base'
          }));

        setBaseCards(formattedBaseCards);

        // Fetch all variants
        const variantsResponse = await axios.get('http://localhost:5000/api/variants');
        const variants = variantsResponse.data;

        // Fetch variant cards for each variant
        const variantCardsPromises = variants.map(variant =>
          axios.get(`http://localhost:5000/api/variant-cards?variant_id=${variant.id}`)
        );

        const variantCardsResponses = await Promise.all(variantCardsPromises);
        const allVariantCards = variantCardsResponses.flatMap(response =>
          response.data.map(card => ({
            ...card,
            type: 'variant'
          }))
        );

        setVariantCards(allVariantCards);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cards:', error);
        setError('Erreur lors du chargement des cartes');
        setLoading(false);
      }
    };

    fetchAllCards();
  }, []);

  // Handle power selection
  const handlePowerSelect = (card) => {
    // If we already have 3 powers and this isn't one of them, don't add it
    if (selectedPowers.length >= 3 && !selectedPowers.some(p => p.id === card.id && p.type === card.type)) {
      return;
    }

    // Check if this card is already selected
    const existingIndex = selectedPowers.findIndex(p => p.id === card.id && p.type === card.type);

    if (existingIndex >= 0) {
      // Remove the card if it's already selected
      const newPowers = [...selectedPowers];
      newPowers.splice(existingIndex, 1);
      setSelectedPowers(newPowers);
    } else {
      // Add the card if we have less than 3 powers
      if (selectedPowers.length < 3) {
        setSelectedPowers([...selectedPowers, card]);
      }
    }
  };

  // Combine cards based on includeVariants setting
  const availableCards = React.useMemo(() => {
    if (includeVariants) {
      return [...baseCards, ...variantCards];
    } else {
      return [...baseCards];
    }
  }, [baseCards, variantCards, includeVariants]);

  // Filter cards based on search term and team filter
  const filteredCards = availableCards.filter(card => {
    // Apply search filter
    const matchesSearch = searchTerm === '' ||
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply team filter
    const matchesTeam = teamFilter === 'all' || card.team === teamFilter;

    return matchesSearch && matchesTeam;
  });

  // Group cards by team for display
  const groupedCards = () => {
    let result = [];
    let currentTeam = null;

    // Sort cards by team first, then alphabetically by name
    const sortedCards = [...filteredCards].sort((a, b) => {
      // Define team order
      const teamOrder = {
        'Village': 1,
        'Loups-Garous': 2,
        'Solitaire': 3,
        'Seul': 3  // Same priority as Solitaire
      };

      // First sort by team order
      const teamOrderA = teamOrder[a.team] || 999;
      const teamOrderB = teamOrder[b.team] || 999;

      if (teamOrderA !== teamOrderB) {
        return teamOrderA - teamOrderB;
      }

      // If same team, sort alphabetically by name
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });

    // Create sections for each team
    sortedCards.forEach(card => {
      const team = card.team;

      // If we're starting a new team section, add a team header
      if (team !== currentTeam) {
        currentTeam = team;
        const displayTeam = team === 'Seul' ? 'Solitaire' : team;

        // Add a separator if this isn't the first team
        if (result.length > 0) {
          result.push(
            <div key={`separator-${team}`} className="comedien-team-separator"></div>
          );
        }

        // Add the team header
        result.push(
          <div key={`header-${team}`} className="comedien-team-header">
            <h3 className={`comedien-team-title ${(team === 'Seul' ? 'solitaire' : team.toLowerCase()).replace(/[^a-z0-9]/g, '-')}`}>
              {displayTeam}
            </h3>
          </div>
        );
      }

      // Check if this card is selected
      const isSelected = selectedPowers.some(p => p.id === card.id && p.type === card.type);

      // Add the card
      result.push(
        <div
          key={`${card.type}-${card.id}`}
          className={`comedien-card-item ${isSelected ? 'selected' : ''}`}
          onClick={() => handlePowerSelect(card)}
        >
          <img
            src={card.image_url || '/images/defaut.png'}
            alt={card.name}
            className="comedien-card-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/defaut.png';
            }}
          />
          <div className="comedien-card-item-header">
            <h3>{card.name}</h3>
            <span className={`comedien-card-team ${(card.team === 'Seul' ? 'solitaire' : card.team.toLowerCase()).replace(/[^a-z0-9]/g, '-')}`}>
              {card.team === 'Seul' ? 'Solitaire' : card.team}
            </span>
          </div>
          {card.type === 'variant' && (
            <span className="comedien-card-variant-badge">Variante</span>
          )}
          {isSelected && (
            <div className="comedien-card-selected">
              <span className="comedien-selected-icon">✓</span>
            </div>
          )}
        </div>
      );
    });

    return result;
  };

  return (
    <div className="comedien-config-modal">
      <div className="comedien-config-content">
        <div className="comedien-config-header">
          <h2>Configuration du Comédien</h2>
          <button className="comedien-config-close" onClick={onCancel}>×</button>
        </div>

        <div className="comedien-config-body">
          <p className="comedien-config-instructions">
            Le Comédien peut imiter jusqu'à 3 pouvoirs différents pendant la partie.
            Sélectionnez les 3 pouvoirs que le Comédien pourra utiliser.
          </p>

          {error && (
            <div className="comedien-error">
              {error}
            </div>
          )}

          <div className="comedien-selected-powers">
            <h3>Pouvoirs sélectionnés ({selectedPowers.length}/3)</h3>
            <div className="comedien-powers-grid">
              {selectedPowers.map((card, index) => (
                <div key={`selected-${card.type}-${card.id}-${index}`} className="comedien-selected-power">
                  <img
                    src={card.image_url || '/images/defaut.png'}
                    alt={card.name}
                    className="comedien-selected-power-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/defaut.png';
                    }}
                  />
                  <div className="comedien-selected-power-info">
                    <span className="comedien-selected-power-name">{card.name}</span>
                    <span className={`comedien-selected-power-team ${(card.team === 'Seul' ? 'solitaire' : card.team.toLowerCase()).replace(/[^a-z0-9]/g, '-')}`}>
                      {card.team === 'Seul' ? 'Solitaire' : card.team}
                    </span>
                  </div>
                  <button
                    className="comedien-remove-power"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePowerSelect(card);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="comedien-available-powers">
            <h3>Pouvoirs disponibles</h3>

            <div className="comedien-card-filters">
              <div className="comedien-search-container">
                <input
                  type="text"
                  placeholder="Rechercher une carte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="comedien-search-input"
                />
                {searchTerm && (
                  <button
                    className="comedien-search-clear"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="comedien-team-filter"
              >
                <option value="all">Toutes les équipes</option>
                <option value="Village">Village</option>
                <option value="Loups-Garous">Loups-Garous</option>
                <option value="Solitaire">Solitaire</option>
              </select>

              <div className="comedien-variant-toggle">
                <label className="comedien-checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeVariants}
                    onChange={(e) => setIncludeVariants(e.target.checked)}
                    className="comedien-checkbox"
                  />
                  Inclure les cartes de variantes
                </label>
              </div>
            </div>

            {loading ? (
              <div className="comedien-loading">
                Chargement des cartes...
              </div>
            ) : (
              <div className="comedien-cards-grid">
                {groupedCards()}
              </div>
            )}
          </div>
        </div>

        <div className="comedien-config-actions">
          <button
            className="comedien-btn comedien-btn-secondary"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="comedien-btn"
            onClick={() => onConfigComplete(selectedPowers)}
            disabled={selectedPowers.length === 0 || loading}
          >
            Confirmer ({selectedPowers.length}/3)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComedienConfig;
