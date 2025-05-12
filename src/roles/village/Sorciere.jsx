import React, { useState } from 'react';
import BaseRole, { PlayerSelectionGrid, isPlayerInLove } from '../BaseRole';
import { registerRole } from '../index';

/**
 * Sorciere (Witch) role component
 * Allows the witch to save the werewolf victim or kill another player
 */
const Sorciere = ({
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
  const { nightVictim, witchSaveUsed, witchKillUsed, witchKillTarget, cupidonLovers } = gameState;
  
  // Local state for witch actions
  const [saveUsed, setSaveUsed] = useState(witchSaveUsed || false);
  const [killUsed, setKillUsed] = useState(witchKillUsed || false);
  const [killTarget, setKillTarget] = useState(witchKillTarget || null);
  
  // Handle save potion use
  const handleSave = () => {
    setSaveUsed(true);
    updateGameState({ witchSaveUsed: true });
  };
  
  // Handle kill potion use
  const handleKill = (playerId) => {
    setKillTarget(playerId);
    setKillUsed(true);
    updateGameState({ witchKillTarget: playerId, witchKillUsed: true });
  };
  
  // Handle completing witch actions
  const handleComplete = () => {
    updateGameState({
      witchSaveUsed: saveUsed,
      witchKillUsed: killUsed,
      witchKillTarget: killTarget
    });
    onActionComplete();
  };
  
  // Handle canceling kill selection
  const handleCancelKill = () => {
    setKillTarget(null);
    setKillUsed(false);
    updateGameState({ witchKillTarget: null, witchKillUsed: false });
  };
  
  return (
    <div className="mj-witch-actions">
      {isDead && (
        <div className="mj-dead-role-alert">
          <p><strong>Attention :</strong> Ce rôle appartient à un joueur mort. Vous devez jouer ce rôle.</p>
        </div>
      )}
      
      <h3>Potions de la Sorcière</h3>
      
      <div className="mj-witch-potions">
        {/* Save Potion */}
        <div className={`mj-witch-potion ${saveUsed ? 'used' : ''}`}>
          <h4>Potion de Guérison {saveUsed && '(Utilisée)'}</h4>
          {nightVictim ? (
            <div className="mj-witch-save">
              <p>Les Loups-Garous ont choisi de dévorer :</p>
              <div className="mj-victim-info">
                <h4>{alivePlayers.find(p => p.id === nightVictim)?.name}</h4>
              </div>
              {!saveUsed && (
                <div className="mj-witch-buttons">
                  <button
                    className="mj-btn"
                    onClick={handleSave}
                  >
                    Sauver
                  </button>
                  <button
                    className="mj-btn mj-btn-secondary"
                    onClick={handleComplete}
                  >
                    Ne pas sauver
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p>Aucune victime cette nuit.</p>
          )}
        </div>
        
        {/* Kill Potion */}
        <div className={`mj-witch-potion ${killUsed ? 'used' : ''}`}>
          <h4>Potion de Mort {killUsed && '(Utilisée)'}</h4>
          {!killUsed ? (
            <div className="mj-witch-kill">
              {killTarget ? (
                <div className="mj-victim-info">
                  <p>Vous avez choisi d'éliminer :</p>
                  <h4>{alivePlayers.find(p => p.id === killTarget)?.name}</h4>
                  <div className="mj-witch-buttons" style={{ marginTop: '1rem' }}>
                    <button
                      className="mj-btn"
                      onClick={handleComplete}
                    >
                      Confirmer
                    </button>
                    <button
                      className="mj-btn mj-btn-secondary"
                      onClick={handleCancelKill}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p>Choisissez un joueur à éliminer :</p>
                  <PlayerSelectionGrid
                    players={getAlivePlayers()}
                    onSelect={handleKill}
                    selectedPlayerId={null}
                    cupidonLovers={cupidonLovers}
                  />
                  <button
                    className="mj-btn mj-btn-secondary"
                    onClick={handleComplete}
                  >
                    Ne pas utiliser
                  </button>
                </>
              )}
            </div>
          ) : (
            <div>
              <p>Potion déjà utilisée.</p>
              <button
                className="mj-btn mj-btn-secondary"
                onClick={handleCancelKill}
                style={{ marginTop: '10px' }}
              >
                Annuler l'utilisation
              </button>
            </div>
          )}
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
          onClick={handleComplete}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

// Register the Sorciere role
registerRole({
  name: 'Sorcière',
  team: 'Village',
  wakesUpAtNight: true,
  wakesUpEveryNight: true,
  wakeUpFrequency: null,
  defaultOrder: 3,
  component: Sorciere,
  shouldWakeUp: (role, currentNight) => true,
  initialize: (gameState) => ({
    ...gameState,
    witchSaveUsed: gameState.witchSaveUsed || false,
    witchKillUsed: gameState.witchKillUsed || false,
    witchKillTarget: gameState.witchKillTarget || null
  }),
  handleNightEnd: (gameState) => {
    // Process the witch kill if used
    const { witchKillTarget, victims, cupidonLovers } = gameState;
    let newVictims = [...victims];
    
    if (witchKillTarget) {
      // Only add if not already in the list
      if (!newVictims.includes(witchKillTarget)) {
        newVictims.push(witchKillTarget);
      }
      
      // Check if the witch's target is a lover
      if (cupidonLovers.includes(witchKillTarget)) {
        // Find the other lover
        const otherLoverId = cupidonLovers.find(id => id !== witchKillTarget);
        if (otherLoverId && !newVictims.includes(otherLoverId)) {
          newVictims.push(otherLoverId);
        }
      }
    }
    
    return {
      ...gameState,
      victims: newVictims,
      // Reset witch kill target for the next night
      witchKillTarget: null
    };
  }
});

export default Sorciere;
