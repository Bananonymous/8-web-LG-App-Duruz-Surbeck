import React, { useState } from 'react';
import BaseRole, { PlayerSelectionGrid, isPlayerInLove } from '../BaseRole';
import { registerRole } from '../index';

/**
 * Werewolf role component
 * Allows werewolves to select a victim during the night
 */
const Werewolf = ({
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
  // Get the current night victim from game state
  const [nightVictim, setNightVictim] = useState(gameState.nightVictim || null);
  
  // Get the cupidon lovers from game state
  const cupidonLovers = gameState.cupidonLovers || [];
  
  // Handle victim selection
  const handleVictimSelect = (playerId) => {
    // If the same victim is clicked again, deselect them
    if (nightVictim === playerId) {
      setNightVictim(null);
      updateGameState({ nightVictim: null });
    } else {
      setNightVictim(playerId);
      updateGameState({ nightVictim: playerId });
      
      // Save the selection to localStorage for backup
      try {
        localStorage.setItem('temp_night_victim', playerId.toString());
      } catch (e) {
        console.error('Failed to save night victim to localStorage', e);
      }
    }
  };
  
  // Handle confirming the victim
  const handleConfirmVictim = () => {
    updateGameState({ nightVictim });
    onActionComplete();
  };
  
  // Handle skipping victim selection
  const handleSkipVictim = () => {
    setNightVictim(null);
    updateGameState({ nightVictim: null });
    onActionComplete();
  };
  
  // Get potential victims (non-werewolves who are alive)
  const potentialVictims = getAlivePlayers().filter(player => player.card.team !== 'Loups-Garous');
  
  // Get all alive werewolves for display
  const aliveWerewolves = getAlivePlayers().filter(player => player.card.team === 'Loups-Garous');
  
  return (
    <div className="mj-victim-selection">
      {isDead && (
        <div className="mj-dead-role-alert">
          <p><strong>Attention :</strong> Ce rôle appartient à un joueur mort. Vous devez jouer ce rôle.</p>
        </div>
      )}
      
      <h4>Sélectionner une victime :</h4>
      
      {potentialVictims.length === 0 ? (
        <div>Aucune victime potentielle disponible</div>
      ) : (
        <PlayerSelectionGrid
          players={potentialVictims}
          onSelect={handleVictimSelect}
          selectedPlayerId={nightVictim}
          cupidonLovers={cupidonLovers}
          options={{
            selectionColor: '#e74c3c'
          }}
        />
      )}
      
      {/* Werewolf action buttons */}
      <div className="mj-werewolf-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {nightVictim ? (
          <>
            <button
              className="mj-btn"
              onClick={handleConfirmVictim}
            >
              Confirmer la victime: {alivePlayers.find(p => p.id === nightVictim)?.name}
            </button>
            <button
              className="mj-btn mj-btn-secondary"
              onClick={() => {
                setNightVictim(null);
                updateGameState({ nightVictim: null });
              }}
            >
              Annuler la sélection
            </button>
          </>
        ) : (
          <button
            className="mj-btn mj-btn-secondary"
            onClick={handleSkipVictim}
          >
            Passer (pas de victime)
          </button>
        )}
      </div>
      
      <div className="mj-werewolf-info">
        <h4>Loups-Garous vivants :</h4>
        <div className="mj-werewolf-list">
          {aliveWerewolves.map(player => (
            <div key={player.id} className="mj-werewolf-item">
              {player.name} ({player.card.name})
            </div>
          ))}
        </div>
      </div>
      
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
    </div>
  );
};

// Register the Werewolf role
registerRole({
  name: 'Loup-Garou',
  team: 'Loups-Garous',
  wakesUpAtNight: true,
  wakesUpEveryNight: true,
  wakeUpFrequency: null,
  defaultOrder: 1,
  component: Werewolf,
  shouldWakeUp: (role, currentNight) => true,
  initialize: (gameState) => ({
    ...gameState,
    nightVictim: null
  }),
  handleNightEnd: (gameState) => {
    // Process the night victim
    const { nightVictim, witchSaveUsed, salvateurProtectedPlayer, victims, cupidonLovers } = gameState;
    let newVictims = [...victims];
    
    // Check if the werewolf victim was saved by the witch or protected by the Salvateur
    const savedByWitch = witchSaveUsed && nightVictim;
    const protectedBySalvateur = salvateurProtectedPlayer && nightVictim === salvateurProtectedPlayer;
    
    // Only add werewolf victim if not saved by witch and not protected by Salvateur
    if (nightVictim && !savedByWitch && !protectedBySalvateur) {
      // Only add if not already in the list
      if (!newVictims.includes(nightVictim)) {
        newVictims.push(nightVictim);
      }
      
      // Check if the victim is a lover
      if (cupidonLovers.includes(nightVictim)) {
        // Find the other lover
        const otherLoverId = cupidonLovers.find(id => id !== nightVictim);
        if (otherLoverId && !newVictims.includes(otherLoverId)) {
          newVictims.push(otherLoverId);
        }
      }
    }
    
    return {
      ...gameState,
      victims: newVictims
    };
  }
});

export default Werewolf;
