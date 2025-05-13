import { useState, useEffect } from 'react';
import axios from 'axios';
import './MJPage.css';

const PlayerSetup = ({ playerCount, selectedCards, onComplete, onBack }) => {
  const [players, setPlayers] = useState([]);
  const [cards, setCards] = useState([]);
  const [variantCards, setVariantCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usePlayerNames, setUsePlayerNames] = useState(false);

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

        // Get base cards
        const baseCardIds = selectedCards
          .filter(card => card.type === 'base')
          .map(card => card.id);

        if (baseCardIds.length > 0) {
          const baseCardsPromises = baseCardIds.map(id =>
            axios.get(`http://localhost:5000/api/cards/${id}`)
          );
          const baseCardsResponses = await Promise.all(baseCardsPromises);
          const baseCardsData = baseCardsResponses.map(response => response.data);
          console.log('Base cards data:', baseCardsData);
          setCards(baseCardsData);
        }

        // Get variant cards
        const variantCardIds = selectedCards
          .filter(card => card.type === 'variant')
          .map(card => card.id);

        if (variantCardIds.length > 0) {
          const variantCardsPromises = variantCardIds.map(id =>
            axios.get(`http://localhost:5000/api/variant-cards/${id}`)
          );
          const variantCardsResponses = await Promise.all(variantCardsPromises);
          const variantCardsData = variantCardsResponses.map(response => response.data);
          console.log('Variant cards data:', variantCardsData);
          setVariantCards(variantCardsData);
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
      // Normalize the wakes_up_at_night and wakes_up_every_night properties
      const normalizedCard = {
        ...card,
        wakes_up_at_night: card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0,
        wakes_up_every_night: card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0
      };

      console.log('Assigning normalized card:', {
        name: normalizedCard.name,
        wakes_up_at_night: normalizedCard.wakes_up_at_night,
        wakes_up_every_night: normalizedCard.wakes_up_every_night
      });

      setPlayers(players.map(player =>
        player.id === playerId ? { ...player, card: normalizedCard } : player
      ));
    } else {
      setPlayers(players.map(player =>
        player.id === playerId ? { ...player, card } : player
      ));
    }
  };

  // Handle random card assignment
  const handleRandomAssignment = () => {
    // Create a copy of all available cards
    const allCards = [
      ...cards.map(card => {
        // Ensure wakes_up_at_night is properly set as a boolean or number
        const wakes_up_at_night = card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0;
        const wakes_up_every_night = card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0;

        return {
          ...card,
          type: 'base',
          wakes_up_at_night,
          wakes_up_every_night
        };
      }),
      ...variantCards.map(card => {
        // Ensure wakes_up_at_night is properly set as a boolean or number
        const wakes_up_at_night = card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0;
        const wakes_up_every_night = card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0;

        return {
          ...card,
          type: 'variant',
          wakes_up_at_night,
          wakes_up_every_night
        };
      })
    ];

    console.log('All cards with normalized wake-up properties:', allCards.map(c => ({
      name: c.name,
      wakes_up_at_night: c.wakes_up_at_night,
      wakes_up_every_night: c.wakes_up_every_night
    })));

    // Shuffle cards
    const shuffledCards = [...allCards].sort(() => Math.random() - 0.5);

    // Assign cards to players
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      card: shuffledCards[index % shuffledCards.length]
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

    onComplete(players);
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

  if (loading) {
    return <div className="loading">Chargement des détails des cartes...</div>;
  }

  // Combine base and variant cards with normalized properties
  const allCards = [
    ...cards.map(card => ({
      ...card,
      type: 'base',
      wakes_up_at_night: card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0,
      wakes_up_every_night: card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0
    })),
    ...variantCards.map(card => ({
      ...card,
      type: 'variant',
      wakes_up_at_night: card.wakes_up_at_night === 1 || card.wakes_up_at_night === true ? 1 : 0,
      wakes_up_every_night: card.wakes_up_every_night === 1 || card.wakes_up_every_night === true ? 1 : 0
    }))
  ];

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
                  value={player.card ? `${player.card.type}-${player.card.id}` : ''}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split('-');
                    const card = allCards.find(c => c.type === type && c.id === parseInt(id));
                    handleCardAssignment(player.id, card);
                  }}
                >
                  <option value="">Sélectionner une carte</option>
                  {allCards.map((card, index) => (
                    <option
                      key={`${card.type}-${card.id}-${index}`}
                      value={`${card.type}-${card.id}`}
                    >
                      {card.name}
                    </option>
                  ))}
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
    </div>
  );
};

export default PlayerSetup;
