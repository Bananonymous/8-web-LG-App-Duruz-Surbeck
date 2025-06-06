import React, { useState } from 'react';
import BaseRole, { PlayerSelectionGrid, isPlayerInLove } from '../BaseRole';
import { registerRole } from '../index';

/**
 * Voyante (Seer) role component
 * Allows the player to see another player's role card
 */
const Voyante = ({
  role,
  player,
  onActionComplete,
  onPrevRole,
  alivePlayers,
  getAlivePlayers,
  currentNight,
  gameState,
  updateGameState,
  isDead
}) => {
  const [revealedCard, setRevealedCard] = useState(null);
  
  // Get the cupidon lovers from game state
  const cupidonLovers = gameState.cupidonLovers || [];
  
  // Handle player selection to reveal their card
  const handlePlayerSelect = (playerId) => {
    const selectedPlayer = alivePlayers.find(p => p.id === playerId);
    if (selectedPlayer) {
      setRevealedCard({
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        card: selectedPlayer.card
      });
    }
  };
  
  // Handle closing the revealed card view
  const handleCloseReveal = () => {
    setRevealedCard(null);
    // Optionally, automatically proceed to the next role
    // onActionComplete();
  };
  
  return (
    <div className="mj-voyante-action">
      {isDead && (
        <div className="mj-dead-role-alert">
          <p><strong>Attention :</strong> Ce rôle appartient à un joueur mort. Vous devez jouer ce rôle.</p>
        </div>
      )}
      
      {revealedCard ? (
        <div className="mj-voyante-reveal">
          <div className="mj-revealed-card-fullscreen" onClick={handleCloseReveal}>
            <div className="mj-revealed-card-image-large">
              <img
                src={revealedCard.card.image_url || '/images/defaut.png'}
                alt={revealedCard.card.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/defaut.png';
                }}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  borderRadius: '8px',
                  boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)'
                }}
              />
            </div>
            <div className="mj-revealed-card-name-large">
              {revealedCard.card.name}
            </div>
            <div className="mj-revealed-card-tap">Tapez pour fermer</div>
          </div>
          <button
            className="mj-btn"
            onClick={() => {
              handleCloseReveal();
              onActionComplete();
            }}
          >
            Fermer et Continuer
          </button>
        </div>
      ) : (
        <>
          <h4>Choisissez un joueur pour découvrir son identité :</h4>
          <PlayerSelectionGrid
            players={getAlivePlayers().filter(p => p.id !== player.id)}
            onSelect={handlePlayerSelect}
            selectedPlayerId={null}
            cupidonLovers={cupidonLovers}
          />
        </>
      )}
      
      {!revealedCard && (
        <div className="mj-role-actions">
          <button
            className="mj-btn mj-btn-secondary"
            onClick={onPrevRole}
          >
            Précédent
          </button>
          <button
            className="mj-btn"
            onClick={onActionComplete}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

// Register the Voyante role
registerRole({
  name: 'Voyante',
  team: 'Village',
  wakesUpAtNight: true,
  wakesUpEveryNight: true,
  wakeUpFrequency: null,
  defaultOrder: 2,
  component: Voyante,
  shouldWakeUp: (role, currentNight) => true,
  initialize: (gameState) => ({
    ...gameState,
    voyanteRevealedCard: null
  }),
  handleNightEnd: (gameState) => gameState
});

export default Voyante;
