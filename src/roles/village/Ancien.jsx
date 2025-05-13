import React from 'react';
import BaseRole from '../BaseRole';
import { registerRole } from '../index';

/**
 * Ancien (Elder) role component
 * Special villager who can survive the first attack against them
 * If killed by the village, all villagers lose their powers
 */
const Ancien = ({
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
  // The Ancien doesn't have any specific night actions
  // It uses the default BaseRole UI with some additional information
  
  return (
    <div className="mj-ancien-action">
      {isDead && (
        <div className="mj-dead-role-alert">
          <p><strong>Attention :</strong> Ce rôle appartient à un joueur mort. Vous devez jouer ce rôle.</p>
        </div>
      )}
      
      <div className="mj-role-info">
        <h4>L'Ancien</h4>
        <p>Ce rôle n'a pas d'action spécifique pendant la nuit.</p>
        <p>Rappel des pouvoirs de l'Ancien :</p>
        <ul>
          <li>L'Ancien peut survivre à la première attaque contre lui (des loups-garous ou du village).</li>
          <li>Si l'Ancien est tué par le vote du village, tous les villageois perdent leurs pouvoirs spéciaux.</li>
        </ul>
        
        {gameState.ancienHasUsedProtection && (
          <div className="mj-ancien-used-protection">
            <p><strong>Note :</strong> L'Ancien a déjà utilisé sa protection et ne survivra pas à une nouvelle attaque.</p>
          </div>
        )}
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

// Register the Ancien role
registerRole({
  name: 'Ancien',
  team: 'Village',
  wakesUpAtNight: false,
  wakesUpEveryNight: false,
  wakeUpFrequency: null,
  defaultOrder: 10, // Lower priority than most active roles
  component: Ancien,
  shouldWakeUp: (role, currentNight) => false, // Doesn't wake up at night
  initialize: (gameState) => ({
    ...gameState,
    ancienHasUsedProtection: gameState.ancienHasUsedProtection || false,
    ancienKilledByVillage: gameState.ancienKilledByVillage || false
  }),
  handleNightEnd: (gameState) => gameState // No night action to process
});

export default Ancien;
