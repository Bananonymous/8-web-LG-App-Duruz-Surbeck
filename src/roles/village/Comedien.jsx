import React, { useState, useEffect } from 'react';
import { registerRole } from '../index';
import RoleFactory from '../RoleFactory';
import BaseRole from '../BaseRole';
import '../../components/Game/ComedienStyles.css';

/**
 * Comédien (Comedian) role component
 * Allows the player to imitate up to 3 different roles during the game
 */
const Comedien = ({
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
  // Get the powers assigned to this Comedian during setup
  const comedienPowers = React.useMemo(() => {
    if (!gameState.gameConfig || !gameState.gameConfig.players) {
      return [];
    }

    // Find this player in the game config
    const thisPlayer = gameState.gameConfig.players.find(p =>
      p.id === player.id || p.name === player.name
    );

    // Return the powers if they exist
    return thisPlayer?.comedienPowers || [];
  }, [gameState.gameConfig, player]);

  // Get the currently selected power for this night
  const [selectedPower, setSelectedPower] = useState(null);

  // Track if we're in power selection mode or action mode
  const [selectionMode, setSelectionMode] = useState(true);

  // Track which powers have been used (for UI indication only)
  const [usedPowers, setUsedPowers] = useState(gameState.comedienUsedPowers || []);

  // Handle power selection
  const handlePowerSelect = (power) => {
    setSelectedPower(power);
    setSelectionMode(false);

    // Add to used powers if not already there
    if (!usedPowers.some(p => p.id === power.id && p.name === power.name)) {
      const newUsedPowers = [...usedPowers, { id: power.id, name: power.name }];
      setUsedPowers(newUsedPowers);
      updateGameState({ comedienUsedPowers: newUsedPowers });
    }
  };

  // Handle action completion from the imitated role
  const handleActionComplete = () => {
    // Complete the Comedian's turn
    onActionComplete();
  };

  // Render power selection UI
  const renderPowerSelection = () => (
    <div className="mj-comedien-selection">
      <h4>Choisissez un pouvoir à utiliser cette nuit :</h4>
      <p className="mj-comedien-instruction">
        Le Comédien peut imiter l'un de ses 3 pouvoirs chaque nuit.
        Sélectionnez le pouvoir que vous souhaitez utiliser.
      </p>

      <div className="mj-comedien-roles-grid">
        {comedienPowers.map(power => {
          // Check if this power has been used before
          const isUsed = usedPowers.some(p => p.id === power.id && p.name === power.name);

          return (
            <div
              key={power.id}
              className={`mj-comedien-role-card ${isUsed ? 'used' : ''}`}
              onClick={() => handlePowerSelect(power)}
            >
              <div className="mj-comedien-role-header">
                <h4>{power.name}</h4>
                <span className={`mj-card-team ${power.team.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                  {power.team}
                </span>
              </div>
              {isUsed && <div className="mj-comedien-role-used">Déjà utilisé</div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render the imitated role's UI
  const renderPowerAction = () => {
    if (!selectedPower) return null;

    // Create props for the imitated role
    const imitatedRoleProps = {
      role: selectedPower,
      player,
      onActionComplete: handleActionComplete,
      onPrevRole: () => setSelectionMode(true),
      alivePlayers,
      getAlivePlayers,
      currentNight,
      gameState,
      updateGameState,
      isDead
    };

    // Use RoleFactory to render the appropriate role component
    return (
      <div className="mj-comedien-imitation">
        <div className="mj-comedien-imitation-header">
          <div className="mj-comedien-imitation-info">
            <h4>Vous utilisez le pouvoir : {selectedPower.name}</h4>
            <p className="mj-comedien-imitation-note">
              Le Comédien utilise ce pouvoir pour cette nuit uniquement
            </p>
          </div>
          <button
            className="mj-btn mj-btn-secondary"
            onClick={() => setSelectionMode(true)}
          >
            Changer de pouvoir
          </button>
        </div>

        <RoleFactory {...imitatedRoleProps} />
      </div>
    );
  };

  return (
    <div className="mj-comedien-action">
      {isDead && (
        <div className="mj-dead-role-alert">
          <p><strong>Attention :</strong> Ce rôle appartient à un joueur mort. Vous devez jouer ce rôle.</p>
        </div>
      )}

      {comedienPowers.length === 0 ? (
        <div className="mj-comedien-no-powers">
          <h4>Aucun pouvoir configuré</h4>
          <p>
            Le Comédien n'a pas de pouvoirs configurés. Veuillez configurer les pouvoirs du Comédien
            dans la phase de configuration des joueurs.
          </p>
          <div className="mj-role-actions">
            <button
              className="mj-btn"
              onClick={onActionComplete}
            >
              Suivant
            </button>
          </div>
        </div>
      ) : selectionMode ? (
        <>
          {renderPowerSelection()}
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
              Passer
            </button>
          </div>
        </>
      ) : (
        renderPowerAction()
      )}
    </div>
  );
};

// Register the Comedien role
registerRole({
  name: 'Comédien',
  team: 'Village',
  wakesUpAtNight: true,
  wakesUpEveryNight: true,
  wakeUpFrequency: null,
  defaultOrder: 3, // Early in the night phase
  component: Comedien,
  shouldWakeUp: (role, currentNight) => true,
  initialize: (gameState) => ({
    ...gameState,
    comedienUsedPowers: gameState.comedienUsedPowers || []
  }),
  handleNightEnd: (gameState) => gameState // No special processing needed
});

export default Comedien;
