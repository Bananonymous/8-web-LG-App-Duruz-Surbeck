import React from 'react';
import BaseRole from '../BaseRole';
import { registerRole } from '../index';

/**
 * Chevalier à l'épée rouillée (Knight with the Rusty Sword) role component
 * Special villager who, when killed by werewolves, also kills the first werewolf to his right
 */
const Chevalier = ({
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
  // The Chevalier doesn't have any specific night actions
  // It uses the default BaseRole UI with some additional information

  return (
    <div className="mj-chevalier-action">
      {isDead && (
        <div className="mj-dead-role-alert">
          <p><strong>Attention :</strong> Ce rôle appartient à un joueur mort. Vous devez jouer ce rôle.</p>
        </div>
      )}

      <div className="mj-role-info">
        <h4>Le Chevalier à l'épée rouillée</h4>
        <p>Ce rôle n'a pas d'action spécifique pendant la nuit.</p>
        <p>Rappel des pouvoirs du Chevalier à l'épée rouillée :</p>
        <ul>
          <li>Si le Chevalier est tué par les Loups-Garous, le premier Loup-Garou à sa droite meurt la nuit suivante.</li>
        </ul>
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

// Register the Chevalier role
registerRole({
  name: 'Chevalier à l\'épée rouillée',
  team: 'Village',
  wakesUpAtNight: false,
  wakesUpEveryNight: false,
  wakeUpFrequency: null,
  defaultOrder: 11, // Lower priority than most active roles
  component: Chevalier,
  shouldWakeUp: (role, currentNight) => false, // Doesn't wake up at night
  initialize: (gameState) => ({
    ...gameState,
    chevalierKilledByWerewolves: gameState.chevalierKilledByWerewolves || false
  }),
  handleNightEnd: (gameState) => gameState // No night action to process
});

export default Chevalier;
