import { useState, useEffect } from 'react';
import axios from 'axios';
import './MJPage.css';
import ComedienConfig from './ComedienConfig';

const PlayerSetup = ({ playerCount, selectedCards, onComplete, onBack }) => {
  const [players, setPlayers] = useState([]);
  const [cards, setCards] = useState([]);
  const [variantCards, setVariantCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usePlayerNames, setUsePlayerNames] = useState(false);

  // Comedian configuration state
  const [showComedienConfig, setShowComedienConfig] = useState(false);
  const [comedienPlayer, setComedienPlayer] = useState(null);
  const [comedienPowers, setComedienPowers] = useState([]);

  // Initialize players
  useEffect(() => {
    const initialPlayers = Array.from({ length: playerCount }, (_, index) => ({
      id: index + 1,
      name: `Joueur ${index + 1}`,
      card: null
    }));

    setPlayers(initialPlayers);
  }, [playerCount]);

  // Fetch card details
  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        setLoading(true);

        // Create a map of instanceIds for each card
        const instanceIdMap = {};
        selectedCards.forEach(card => {
          if (card.instanceId) {
            const key = `${card.type}-${card.id}`;
            if (!instanceIdMap[key]) {
              instanceIdMap[key] = [];
            }
            instanceIdMap[key].push(card.instanceId);
          }
        });

        // Get base cards - use the actual selectedCards array to maintain exact counts
        const baseCards = selectedCards.filter(card => card.type === 'base');

        if (baseCards.length > 0) {
          // Get unique IDs to fetch card details
          const uniqueBaseCardIds = [...new Set(baseCards.map(card => card.id))];

          const baseCardsPromises = uniqueBaseCardIds.map(id =>
            axios.get(`http://localhost:5000/api/cards/${id}`)
          );
          const baseCardsResponses = await Promise.all(baseCardsPromises);

          // Create a map of card data by ID for easy lookup
          const baseCardDataMap = {};
          baseCardsResponses.forEach(response => {
            const cardData = response.data;
            baseCardDataMap[cardData.id] = cardData;
          });

          // Process each selected card individually to maintain the exact count
          const processedBaseCards = baseCards.map(selectedCard => {
            const cardData = baseCardDataMap[selectedCard.id];
            if (!cardData) {
              console.error(`Card data not found for ID: ${selectedCard.id}`);
              return null;
            }

            // Use the instanceId from the selected card
            return {
              ...cardData,
              instanceId: selectedCard.instanceId,
              type: 'base'
            };
          }).filter(Boolean); // Remove any null entries

          console.log('Processed base cards:', processedBaseCards);
          setCards(processedBaseCards);
        }

        // Get variant cards - use the actual selectedCards array to maintain exact counts
        const variantCards = selectedCards.filter(card => card.type === 'variant');

        if (variantCards.length > 0) {
          // Get unique IDs to fetch card details
          const uniqueVariantCardIds = [...new Set(variantCards.map(card => card.id))];

          const variantCardsPromises = uniqueVariantCardIds.map(id =>
            axios.get(`http://localhost:5000/api/variant-cards/${id}`)
          );
          const variantCardsResponses = await Promise.all(variantCardsPromises);

          // Create a map of card data by ID for easy lookup
          const variantCardDataMap = {};
          variantCardsResponses.forEach(response => {
            const cardData = response.data;
            variantCardDataMap[cardData.id] = cardData;
          });

          // Process each selected card individually to maintain the exact count
          const processedVariantCards = variantCards.map(selectedCard => {
            const cardData = variantCardDataMap[selectedCard.id];
            if (!cardData) {
              console.error(`Variant card data not found for ID: ${selectedCard.id}`);
              return null;
            }

            // Use the instanceId from the selected card
            return {
              ...cardData,
              instanceId: selectedCard.instanceId,
              type: 'variant'
            };
          }).filter(Boolean); // Remove any null entries

          console.log('Processed variant cards:', processedVariantCards);
          setVariantCards(processedVariantCards);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching card details:', error);
        setError('Erreur lors du chargement des détails des cartes');
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, [selectedCards]);

  // Handle player name change
  const handlePlayerNameChange = (playerId, name) => {
    setPlayers(players.map(player =>
      player.id === playerId ? { ...player, name } : player
    ));
  };

  // Handle player card assignment
  const handleCardAssignment = (playerId, card) => {
    if (card) {
      // Use the existing instanceId - it should already be set correctly
      // No need to generate a new one which could cause inconsistencies
      const instanceId = card.instanceId;

      // Normalize the wakes_up_at_night and wakes_up_every_night properties
      const normalizedCard = {
        ...card,
        wakes_up_at_night: card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0,
        wakes_up_every_night: card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0,
        // Keep the existing instanceId
        instanceId
      };

      console.log('Assigning normalized card:', {
        name: normalizedCard.name,
        wakes_up_at_night: normalizedCard.wakes_up_at_night,
        wakes_up_every_night: normalizedCard.wakes_up_every_night,
        instanceId: normalizedCard.instanceId
      });

      // Update players with the new card
      setPlayers(players.map(player =>
        player.id === playerId ? { ...player, card: normalizedCard } : player
      ));

      // Check if this is a Comedian card
      if (normalizedCard.name === 'Comédien') {
        // Show the Comedian configuration modal
        setComedienPlayer({
          id: playerId,
          name: players.find(p => p.id === playerId)?.name || `Joueur ${playerId}`
        });
        setShowComedienConfig(true);
      } else {
        // If a player had Comedian before and now has a different card, clear their powers
        const playerHadComedian = players.find(p => p.id === playerId)?.card?.name === 'Comédien';
        if (playerHadComedian) {
          // Remove this player's powers from comedienPowers
          setComedienPowers(prevPowers => prevPowers.filter(p => p.playerId !== playerId));
        }
      }
    } else {
      // If removing a card, check if it was a Comedian
      const playerHadComedian = players.find(p => p.id === playerId)?.card?.name === 'Comédien';
      if (playerHadComedian) {
        // Remove this player's powers from comedienPowers
        setComedienPowers(prevPowers => prevPowers.filter(p => p.playerId !== playerId));
      }

      console.log('Removing card from player:', playerId);

      // Update players with null card
      setPlayers(players.map(player =>
        player.id === playerId ? { ...player, card } : player
      ));
    }
  };

  // Handle random card assignment
  const handleRandomAssignment = () => {
    // Create a deep copy of all available cards with their instanceIds
    const allCardsWithInstances = [
      ...cards.map(card => {
        // Ensure wakes_up_at_night is properly set as a boolean or number
        const wakes_up_at_night = card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0;
        const wakes_up_every_night = card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0;

        // Use the existing instanceId - it should already be set correctly
        // No need to generate a new one which could cause inconsistencies
        const instanceId = card.instanceId;

        return {
          ...card,
          type: 'base',
          wakes_up_at_night,
          wakes_up_every_night,
          instanceId
        };
      }),
      ...variantCards.map(card => {
        // Ensure wakes_up_at_night is properly set as a boolean or number
        const wakes_up_at_night = card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0;
        const wakes_up_every_night = card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0;

        // Use the existing instanceId - it should already be set correctly
        // No need to generate a new one which could cause inconsistencies
        const instanceId = card.instanceId;

        return {
          ...card,
          type: 'variant',
          wakes_up_at_night,
          wakes_up_every_night,
          instanceId
        };
      })
    ];

    console.log('All cards with normalized properties:', allCardsWithInstances.map(c => ({
      name: c.name,
      wakes_up_at_night: c.wakes_up_at_night,
      wakes_up_every_night: c.wakes_up_every_night,
      instanceId: c.instanceId
    })));

    // Shuffle cards
    const shuffledCards = [...allCardsWithInstances].sort(() => Math.random() - 0.5);

    // Take only as many cards as there are players
    const cardsToAssign = shuffledCards.slice(0, players.length);

    // Assign cards to players
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      card: index < cardsToAssign.length ? cardsToAssign[index] : null
    }));

    setPlayers(updatedPlayers);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if all players have cards
    const allPlayersHaveCards = players.every(player => player.card);

    if (!allPlayersHaveCards) {
      setError('Tous les joueurs doivent avoir une carte assignée');
      return;
    }

    // Check if all Comedian players have powers assigned
    const comedienPlayers = players.filter(player => player.card && player.card.name === 'Comédien');
    const allComedienHavePowers = comedienPlayers.every(player => {
      const playerPowers = comedienPowers.filter(p => p.playerId === player.id);
      return playerPowers.length > 0;
    });

    if (comedienPlayers.length > 0 && !allComedienHavePowers) {
      setError('Tous les joueurs avec le rôle Comédien doivent avoir des pouvoirs assignés');

      // Find the first Comedian without powers
      const comedienWithoutPowers = comedienPlayers.find(player => {
        const playerPowers = comedienPowers.filter(p => p.playerId === player.id);
        return playerPowers.length === 0;
      });

      if (comedienWithoutPowers) {
        setComedienPlayer({
          id: comedienWithoutPowers.id,
          name: comedienWithoutPowers.name
        });
        setShowComedienConfig(true);
      }

      return;
    }

    // Add Comedian powers to player objects
    const playersWithComedienPowers = players.map(player => {
      if (player.card && player.card.name === 'Comédien') {
        const playerPowers = comedienPowers.filter(p => p.playerId === player.id);
        return {
          ...player,
          comedienPowers: playerPowers.map(p => ({
            id: p.id,
            name: p.name,
            team: p.team,
            type: p.type
          }))
        };
      }
      return player;
    });

    onComplete(playersWithComedienPowers);
  };

  // Toggle player names
  const togglePlayerNames = () => {
    setUsePlayerNames(!usePlayerNames);

    if (!usePlayerNames) {
      // Reset to default names
      setPlayers(players.map(player => ({
        ...player,
        name: `Joueur ${player.id}`
      })));
    }
  };

  // Handle Comedian configuration completion
  const handleComedienConfigComplete = (selectedPowers) => {
    if (comedienPlayer) {
      // Add player ID to each power
      const powersWithPlayerId = selectedPowers.map(power => ({
        ...power,
        playerId: comedienPlayer.id
      }));

      // Remove any existing powers for this player
      const filteredPowers = comedienPowers.filter(p => p.playerId !== comedienPlayer.id);

      // Add the new powers
      setComedienPowers([...filteredPowers, ...powersWithPlayerId]);
    }

    // Close the modal
    setShowComedienConfig(false);
  };

  // Handle Comedian configuration cancellation
  const handleComedienConfigCancel = () => {
    setShowComedienConfig(false);
  };

  if (loading) {
    return <div className="loading">Chargement des détails des cartes...</div>;
  }

  // Combine base and variant cards with normalized properties
  // First, create a map to track instanceIds we've already seen
  const seenInstanceIds = new Set();

  // Process base cards first
  const processedBaseCards = cards.map(card => {
    const wakes_up_at_night = card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0;
    const wakes_up_every_night = card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0;

    // Check if this instanceId has been seen before
    if (card.instanceId && seenInstanceIds.has(card.instanceId)) {
      // Create a new unique instanceId
      const newInstanceId = `${card.instanceId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      seenInstanceIds.add(newInstanceId);

      return {
        ...card,
        type: 'base',
        wakes_up_at_night,
        wakes_up_every_night,
        instanceId: newInstanceId
      };
    }

    // Add this instanceId to the set of seen instanceIds
    if (card.instanceId) {
      seenInstanceIds.add(card.instanceId);
    }

    return {
      ...card,
      type: 'base',
      wakes_up_at_night,
      wakes_up_every_night,
      instanceId: card.instanceId
    };
  });

  // Process variant cards next
  const processedVariantCards = variantCards.map(card => {
    const wakes_up_at_night = card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0;
    const wakes_up_every_night = card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0;

    // Check if this instanceId has been seen before
    if (card.instanceId && seenInstanceIds.has(card.instanceId)) {
      // Create a new unique instanceId
      const newInstanceId = `${card.instanceId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      seenInstanceIds.add(newInstanceId);

      return {
        ...card,
        type: 'variant',
        wakes_up_at_night,
        wakes_up_every_night,
        instanceId: newInstanceId
      };
    }

    // Add this instanceId to the set of seen instanceIds
    if (card.instanceId) {
      seenInstanceIds.add(card.instanceId);
    }

    return {
      ...card,
      type: 'variant',
      wakes_up_at_night,
      wakes_up_every_night,
      instanceId: card.instanceId
    };
  });

  // Combine the processed cards
  const allCards = [...processedBaseCards, ...processedVariantCards];

  return (
    <div className="mj-card">
      <h2>Configuration des joueurs</h2>

      {error && <div className="mj-error">{error}</div>}

      <div className="mj-setup-actions">
        <div className="mj-setup-action">
          <button
            type="button"
            className={`mj-btn-toggle ${usePlayerNames ? 'active' : ''}`}
            onClick={togglePlayerNames}
          >
            {usePlayerNames ? 'Noms personnalisés ✓' : 'Noms par défaut'}
          </button>
          <span className="mj-setup-action-desc">
            {usePlayerNames ? 'Vous pouvez saisir des noms personnalisés' : 'Utiliser Joueur 1, Joueur 2, etc.'}
          </span>
        </div>

        <div className="mj-setup-action">
          <button
            type="button"
            className="mj-btn"
            onClick={handleRandomAssignment}
          >
            Distribution aléatoire
          </button>
          <span className="mj-setup-action-desc">
            Assigner aléatoirement les cartes aux joueurs
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mj-players-grid">
          {players.map(player => (
            <div key={player.id} className="mj-player-item">
              <div className="mj-player-header">
                {usePlayerNames ? (
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                    placeholder="Nom du joueur"
                  />
                ) : (
                  <h3>{player.name}</h3>
                )}
              </div>

              <div className="mj-player-card-select">
                <select
                  value={player.card ? `${player.card.type}-${player.card.id}-${player.card.instanceId}` : ''}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      // Handle deselection
                      handleCardAssignment(player.id, null);
                    } else {
                      // Parse the value to get card details
                      const parts = e.target.value.split('-');
                      // The instanceId might contain hyphens, so we need to handle that
                      const type = parts[0];
                      const id = parseInt(parts[1]);
                      const instanceId = parts.slice(2).join('-');

                      // Find the exact card instance
                      const card = allCards.find(c =>
                        c.type === type &&
                        c.id === id &&
                        c.instanceId === instanceId
                      );

                      if (card) {
                        handleCardAssignment(player.id, card);
                      } else {
                        console.error('Card not found:', type, id, instanceId);
                      }
                    }
                  }}
                >
                  <option value="">Sélectionner une carte</option>
                  {allCards.map((card, cardIndex) => {
                    // Check if this specific card instance is already assigned to another player
                    const assignedPlayer = players.find(p =>
                      p.id !== player.id && // Not the current player
                      p.card && // Has a card assigned
                      p.card.instanceId === card.instanceId // Compare by instanceId only
                    );

                    // Determine if this option should be disabled
                    const isDisabled = assignedPlayer !== undefined;

                    // Create a unique value that includes the instanceId
                    const optionValue = `${card.type}-${card.id}-${card.instanceId}`;

                    // Create a truly unique key for each option by adding the player ID and the card index
                    // This ensures that even if two cards have the same instanceId, they'll have different keys
                    const uniqueKey = `${optionValue}-player${player.id}-${cardIndex}`;

                    return (
                      <option
                        key={uniqueKey}
                        value={optionValue}
                        disabled={isDisabled}
                        style={isDisabled ? { color: '#999', fontStyle: 'italic' } : {}}
                      >
                        {card.name}{isDisabled ? ` (${assignedPlayer.name})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {player.card && (
                <div className="mj-player-card-info">
                  <div className="mj-player-card-details">
                    <span className={`mj-card-team-small ${player.card.team.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}></span>
                    {player.card.type === 'variant' && (
                      <span className="mj-card-variant-badge-small">Variante</span>
                    )}
                  </div>
                  <div className="mj-player-card-name">
                    {player.card.name}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mj-actions">
          <button
            type="button"
            className="mj-btn mj-btn-secondary"
            onClick={onBack}
          >
            Retour
          </button>
          <button type="submit" className="mj-btn">
            Commencer la partie
          </button>
        </div>
      </form>

      {/* Comedian Configuration Modal */}
      {showComedienConfig && (
        <ComedienConfig
          onConfigComplete={handleComedienConfigComplete}
          onCancel={handleComedienConfigCancel}
          initialPowers={comedienPowers.filter(p => p.playerId === comedienPlayer?.id)}
        />
      )}
    </div>
  );
};

export default PlayerSetup;
