import React, { useState } from 'react';
import BaseRole, { PlayerSelectionGrid, isPlayerInLove } from '../BaseRole';
import { registerRole } from '../index';

/**
 * Infect père des loups (Infect Father of Wolves) role component
 * Special werewolf who can convert a victim to a werewolf instead of killing them
 */
const InfectPere = ({
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
  
  // Get the infection state
  const [infectUsed, setInfectUsed] = useState(gameState.infectUsed || false);
  const [infectVictim, setInfectVictim] = useState(gameState.infectVictim || false);
  
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
    updateGameState({ 
      nightVictim,
      infectVictim
    });
    onActionComplete();
  };
  
  // Handle skipping victim selection
  const handleSkipVictim = () => {
    setNightVictim(null);
    updateGameState({ nightVictim: null });
    onActionComplete();
  };
  
  // Handle toggling infection
  const handleToggleInfection = () => {
    // Only allow infection if it hasn't been used before
    if (!infectUsed) {
      const newInfectVictim = !infectVictim;
      setInfectVictim(newInfectVictim);
      updateGameState({ infectVictim: newInfectVictim });
    }
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
      
      {/* Infection option */}
      {nightVictim && !infectUsed && (
        <div className="mj-infect-option" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={infectVictim}
              onChange={handleToggleInfection}
              style={{ marginRight: '0.5rem', transform: 'scale(1.2)' }}
            />
            <span>
              <strong>Infecter au lieu de tuer</strong> - La victime devient un Loup-Garou (pouvoir utilisable une seule fois par partie)
            </span>
          </label>
        </div>
      )}
      
      {/* Infection already used message */}
      {infectUsed && (
        <div className="mj-infect-used" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(128, 128, 128, 0.1)', borderRadius: '8px' }}>
          <p style={{ margin: 0 }}>
            <em>Le pouvoir d'infection a déjà été utilisé dans cette partie.</em>
          </p>
        </div>
      )}
      
      {/* Werewolf action buttons */}
      <div className="mj-werewolf-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {nightVictim ? (
          <>
            <button
              className="mj-btn"
              onClick={handleConfirmVictim}
            >
              Confirmer {infectVictim ? 'l\'infection' : 'la victime'}: {alivePlayers.find(p => p.id === nightVictim)?.name}
            </button>
            <button
              className="mj-btn mj-btn-secondary"
              onClick={() => {
                setNightVictim(null);
                setInfectVictim(false);
                updateGameState({ nightVictim: null, infectVictim: false });
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

// Register the InfectPere role
registerRole({
  name: 'Infect père des loups',
  team: 'Loups-Garous',
  wakesUpAtNight: true,
  wakesUpEveryNight: true,
  wakeUpFrequency: null,
  defaultOrder: 1, // Same as regular werewolves
  component: InfectPere,
  shouldWakeUp: (role, currentNight) => true,
  initialize: (gameState) => ({
    ...gameState,
    nightVictim: null,
    infectUsed: gameState.infectUsed || false,
    infectVictim: false
  }),
  handleNightEnd: (gameState) => {
    // Process the night victim
    const { nightVictim, infectVictim, infectUsed, witchSaveUsed, salvateurProtectedPlayer, victims, cupidonLovers } = gameState;
    let newVictims = [...victims];
    let newInfectUsed = infectUsed;
    
    // Check if the werewolf victim was saved by the witch or protected by the Salvateur
    const savedByWitch = witchSaveUsed && nightVictim;
    const protectedBySalvateur = salvateurProtectedPlayer && nightVictim === salvateurProtectedPlayer;
    
    // If infection is chosen and hasn't been used before
    if (nightVictim && infectVictim && !infectUsed) {
      // Mark infection as used
      newInfectUsed = true;
      
      // Don't add to victims list - they'll be converted instead
      // The actual conversion happens in GameManager.jsx
    }
    // Otherwise, handle as normal werewolf kill
    else if (nightVictim && !savedByWitch && !protectedBySalvateur) {
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
      victims: newVictims,
      infectUsed: newInfectUsed
    };
  }
});

export default InfectPere;
