import React, { useState } from 'react';
import BaseRole, { PlayerSelectionGrid, isPlayerInLove } from '../BaseRole';
import { registerRole } from '../index';

/**
 * Salvateur (Protector) role component
 * Allows the player to protect another player from werewolf attacks each night
 * Cannot protect the same player two nights in a row
 */
const Salvateur = ({
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
  // Get relevant state from game state
  const { salvateurProtectedPlayer, salvateurLastProtectedPlayer, cupidonLovers } = gameState;
  
  // Local state for protected player
  const [protectedPlayer, setProtectedPlayer] = useState(salvateurProtectedPlayer || null);
  
  // Handle player selection
  const handlePlayerSelect = (playerId) => {
    // If the same player is clicked again, deselect them
    if (protectedPlayer === playerId) {
      setProtectedPlayer(null);
      updateGameState({ salvateurProtectedPlayer: null });
    } else {
      setProtectedPlayer(playerId);
      updateGameState({ salvateurProtectedPlayer: playerId });
    }
  };
  
  // Handle confirming protection
  const handleConfirmProtection = () => {
    updateGameState({ 
      salvateurProtectedPlayer: protectedPlayer,
      // Update the last protected player for the next night
      salvateurLastProtectedPlayer: protectedPlayer
    });
    onActionComplete();
  };
  
  // Handle skipping protection
  const handleSkipProtection = () => {
    setProtectedPlayer(null);
    updateGameState({ salvateurProtectedPlayer: null });
    onActionComplete();
  };
  
  return (
    <div className="mj-salvateur-action">
      {isDead && (
        <div className="mj-dead-role-alert">
          <p><strong>Attention :</strong> Ce rôle appartient à un joueur mort. Vous devez jouer ce rôle.</p>
        </div>
      )}
      
      <h4>Choisissez un joueur à protéger cette nuit :</h4>
      
      <div className="mj-info-box" style={{
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <p><strong>Règles du Salvateur :</strong></p>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Le joueur protégé ne peut pas être tué par les Loups-Garous cette nuit</li>
          <li>Vous ne pouvez pas protéger la même personne deux nuits de suite</li>
          <li>La protection n'empêche pas l'infection par l'Infect Père des Loups</li>
        </ul>
      </div>
      
      <PlayerSelectionGrid
        players={getAlivePlayers()}
        onSelect={handlePlayerSelect}
        selectedPlayerId={protectedPlayer}
        cupidonLovers={cupidonLovers}
        options={{
          disabledPlayerIds: [salvateurLastProtectedPlayer],
          selectionColor: '33, 150, 243',
          showRoleNames: true
        }}
      />
      
      <div className="mj-role-actions">
        <button
          className="mj-btn mj-btn-secondary"
          onClick={onPrevRole}
        >
          Précédent
        </button>
        <button
          className="mj-btn"
          style={{
            backgroundColor: protectedPlayer ? '#2196f3' : undefined
          }}
          onClick={handleConfirmProtection}
        >
          Confirmer
        </button>
        <button
          className="mj-btn mj-btn-secondary"
          onClick={handleSkipProtection}
        >
          Ne protéger personne
        </button>
      </div>
    </div>
  );
};

// Register the Salvateur role
registerRole({
  name: 'Salvateur',
  team: 'Village',
  wakesUpAtNight: true,
  wakesUpEveryNight: true,
  wakeUpFrequency: null,
  defaultOrder: 4,
  component: Salvateur,
  shouldWakeUp: (role, currentNight) => true,
  initialize: (gameState) => ({
    ...gameState,
    salvateurProtectedPlayer: null,
    salvateurLastProtectedPlayer: null
  }),
  handleNightEnd: (gameState) => {
    // The Salvateur's protection is handled in the main night phase completion
    return gameState;
  }
});

export default Salvateur;
