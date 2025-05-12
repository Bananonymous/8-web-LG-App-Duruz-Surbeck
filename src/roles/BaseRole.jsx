import React from 'react';

/**
 * BaseRole component that all role-specific components should extend.
 * This provides common UI elements and behavior for all roles.
 */
const BaseRole = ({
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
  // Default UI for roles that don't have specific night actions
  return (
    <div className="mj-role-action">
      <h4>Rôle: {role.name}</h4>
      <p>{role.description}</p>
      
      {isDead && (
        <div className="mj-dead-role-alert">
          <p><strong>Attention :</strong> Ce rôle appartient à un joueur mort. Vous devez jouer ce rôle.</p>
        </div>
      )}
      
      <div className="mj-role-info">
        <p>Ce rôle n'a pas d'action spécifique pendant la nuit.</p>
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

/**
 * Helper function to check if a player is in love (has a heart)
 * @param {Array} cupidonLovers - Array of player IDs who are in love
 * @param {string} playerId - The player ID to check
 * @returns {boolean} - Whether the player is in love
 */
export const isPlayerInLove = (cupidonLovers, playerId) => {
  return cupidonLovers.includes(playerId);
};

/**
 * Creates a standard player selection grid
 * @param {Array} players - Array of player objects to display
 * @param {Function} onSelect - Function to call when a player is selected
 * @param {string|null} selectedPlayerId - ID of the currently selected player
 * @param {Array} cupidonLovers - Array of player IDs who are in love
 * @param {Object} options - Additional options for customization
 * @returns {JSX.Element} - The player selection grid
 */
export const PlayerSelectionGrid = ({
  players,
  onSelect,
  selectedPlayerId,
  cupidonLovers = [],
  options = {}
}) => {
  const {
    disabledPlayerIds = [],
    showRoleNames = true,
    selectionColor = 'var(--primary-color)',
    multiSelect = false,
    selectedPlayerIds = []
  } = options;

  return (
    <div className="mj-player-grid">
      {players.map(player => {
        const isSelected = multiSelect 
          ? selectedPlayerIds.includes(player.id)
          : selectedPlayerId === player.id;
        const isDisabled = disabledPlayerIds.includes(player.id);

        return (
          <div
            key={player.id}
            className={`mj-player-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => {
              if (!isDisabled) {
                onSelect(player.id);
              }
            }}
            style={{
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              backgroundColor: isSelected ? `rgba(${selectionColor}, 0.3)` : isDisabled ? '#e9ecef' : '#f8f9fa',
              color: isDisabled ? '#adb5bd' : 'black',
              border: isSelected ? `2px solid ${selectionColor}` : '1px solid #dee2e6',
              padding: '10px',
              margin: '5px',
              borderRadius: '4px',
              fontWeight: isSelected ? 'bold' : 'normal',
              position: 'relative'
            }}
          >
            <div>
              {player.name}
              {isPlayerInLove(cupidonLovers, player.id) && (
                <span style={{ marginLeft: '5px', color: '#e91e63' }}>❤️</span>
              )}
            </div>
            
            {showRoleNames && (
              <div style={{
                fontSize: '0.8em',
                opacity: 0.8,
                marginTop: '3px',
                color: isSelected ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.7)'
              }}>
                {player.card.name}
              </div>
            )}
            
            {isDisabled && (
              <div style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: '#dc3545',
                color: 'white',
                padding: '2px 5px',
                fontSize: '10px',
                borderRadius: '0 4px 0 4px'
              }}>
                Indisponible
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BaseRole;
