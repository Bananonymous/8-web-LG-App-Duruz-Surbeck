import React, { useState, useEffect } from 'react';
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

  // Get the infection state - BUGFIX: Ensure infection is not selected by default
  const [infectVictim, setInfectVictim] = useState(false); // Always start with infection not selected

  // Check if infection has been used in this game
  const [infectUsed, setInfectUsed] = useState(
    gameState.infectUsed || localStorage.getItem('infectUsed') === 'true' || false
  );

  // Update infectUsed if gameState changes - but only once when the component mounts
  useEffect(() => {
    const isInfectUsed = gameState.infectUsed || localStorage.getItem('infectUsed') === 'true' || false;
    if (isInfectUsed !== infectUsed) {
      setInfectUsed(isInfectUsed);
    }

    // Clear any infected players data on first night
    if (currentNight === 1) {
      console.log("First night detected - clearing any infected players data");
      localStorage.removeItem('infected_player_id');
      localStorage.removeItem('infected_players');
      localStorage.removeItem('infectUsed');

      // Also clear from gameState if it exists
      if (gameState && gameState.gameConfig) {
        if (gameState.gameConfig.infectedPlayers) {
          gameState.gameConfig.infectedPlayers = [];
        }
        gameState.gameConfig.infectUsed = false;
      }

      // Update the state
      updateGameState({
        infectUsed: false,
        infectVictim: false
      });
    }
  }, []);

  // BUGFIX: Reset infection state when component mounts
  useEffect(() => {
    // Clear any infection state in localStorage
    localStorage.removeItem('temp_infect_victim');
    // Reset infection state
    setInfectVictim(false);
  }, []); // Empty dependency array means this runs once on mount

  // Get the cupidon lovers from game state
  const cupidonLovers = gameState.cupidonLovers || [];

  // Handle victim selection
  const handleVictimSelect = (playerId) => {
    // If the same victim is clicked again, deselect them
    if (nightVictim === playerId) {
      setNightVictim(null);
      updateGameState({ nightVictim: null });
      // Reset infection state when deselecting
      setInfectVictim(false);
    } else {
      setNightVictim(playerId);
      updateGameState({ nightVictim: playerId });

      // BUGFIX: Always reset infection state when selecting a new victim
      setInfectVictim(false);

      // Save the selection to localStorage for backup
      try {
        localStorage.setItem('temp_night_victim', playerId.toString());
        // Also clear any infection state in localStorage
        localStorage.removeItem('temp_infect_victim');
      } catch (e) {
        console.error('Failed to save night victim to localStorage', e);
      }
    }
  };

  // Handle confirming the victim
  const handleConfirmVictim = () => {
    console.log("Confirming victim in Werewolf component");

    // Check if infection is selected and hasn't been used yet
    if (infectVictim && !infectUsed) {
      console.log("Infection selected and not used yet");

      // CRITICAL FIX: Directly modify the player in gameConfig to ensure UI updates
      if (gameState && gameState.gameConfig && gameState.gameConfig.players) {
        const playerIndex = gameState.gameConfig.players.findIndex(p => p.id === nightVictim);
        if (playerIndex !== -1) {
          // Make a direct modification to the player object
          const player = gameState.gameConfig.players[playerIndex];

          // Update the team to Loups-Garous
          player.card.team = 'Loups-Garous';

          // Add (Infecté) to the name if not already there
          if (!player.name.includes('(Infecté)')) {
            player.name += ' (Infecté)';
          }

          // Ensure infectedPlayers array exists
          if (!gameState.gameConfig.infectedPlayers) {
            gameState.gameConfig.infectedPlayers = [];
          }

          // Add player to infectedPlayers array if not already there
          if (!gameState.gameConfig.infectedPlayers.includes(nightVictim)) {
            gameState.gameConfig.infectedPlayers.push(nightVictim);
          }

          // CRITICAL FIX: Mark infection as used in gameConfig
          gameState.gameConfig.infectUsed = true;

          console.log("Player directly modified in gameConfig:", player);
        }
      }

      // Update game state with infection flags and mark infection as used
      updateGameState({
        nightVictim,
        infectVictim: true,
        infectUsed: true // CRITICAL FIX: Mark infection as used to prevent reuse
      });

      // Save to localStorage as a backup
      localStorage.setItem('temp_infect_victim', 'true');
      localStorage.setItem('infected_player_id', nightVictim.toString());
      localStorage.setItem('infectUsed', 'true'); // CRITICAL FIX: Mark infection as used in localStorage

      // Save infected players array to localStorage
      try {
        const infectedPlayers = gameState.gameConfig.infectedPlayers || [];
        if (!infectedPlayers.includes(nightVictim)) {
          infectedPlayers.push(nightVictim);
        }
        localStorage.setItem('infected_players', JSON.stringify(infectedPlayers));
      } catch (e) {
        console.error('Failed to save infected players to localStorage', e);
      }

      // Log the infection
      const victimName = alivePlayers.find(p => p.id === nightVictim)?.name || `Joueur ${nightVictim}`;
      console.log(`Le joueur ${victimName} a été infecté(e) et rejoint maintenant l'équipe des Loups-Garous tout en conservant son rôle d'origine!`);

      // Set a data attribute on the DOM to ensure the infection is processed
      const roleCard = document.querySelector('.mj-role-card');
      if (roleCard) {
        const currentData = roleCard.getAttribute('data-game-state') || '{}';
        try {
          const parsedData = JSON.parse(currentData);
          parsedData.infectVictim = true;
          parsedData.nightVictim = nightVictim;
          parsedData.infectUsed = true; // CRITICAL FIX: Mark infection as used in DOM data
          roleCard.setAttribute('data-game-state', JSON.stringify(parsedData));
        } catch (e) {
          console.error('Failed to update data-game-state attribute', e);
        }
      }
    } else {
      console.log("Normal kill selected");

      // Update game state with current selections
      updateGameState({
        nightVictim,
        infectVictim: false
      });
    }

    // Complete the action
    onActionComplete();
  };

  // Handle skipping victim selection
  const handleSkipVictim = () => {
    setNightVictim(null);
    updateGameState({ nightVictim: null });
    onActionComplete();
  };

  // Get potential victims (players who are not on the werewolf team)
  const potentialVictims = getAlivePlayers().filter(player => {
    // Exclude actual werewolf roles
    const isActualWerewolf = player.card.name === 'Loup-Garou' || player.card.name === 'Infect père des loups';

    // Exclude infected players (check by team and name)
    const isInfected = player.card.team === 'Loups-Garous' || player.name.includes('(Infecté)');

    // Also check gameConfig.infectedPlayers array
    const isInInfectedArray = gameState && gameState.gameConfig &&
      gameState.gameConfig.infectedPlayers &&
      gameState.gameConfig.infectedPlayers.includes(player.id);

    // Also check localStorage for recently infected players
    let isInLocalStorage = false;
    try {
      const infectedPlayerId = localStorage.getItem('infected_player_id');
      const infectedPlayersStr = localStorage.getItem('infected_players');

      if (infectedPlayerId === player.id.toString()) {
        isInLocalStorage = true;
      }

      if (infectedPlayersStr) {
        const infectedPlayers = JSON.parse(infectedPlayersStr);
        if (infectedPlayers.includes(player.id)) {
          isInLocalStorage = true;
        }
      }
    } catch (e) {
      console.error('Error checking localStorage for infected players', e);
    }

    // Return true only if the player is not a werewolf and not infected
    return !isActualWerewolf && !isInfected && !isInInfectedArray && !isInLocalStorage;
  });

  // Get all alive werewolves for display (including infected players)
  const aliveWerewolves = getAlivePlayers().filter(player => {
    // Include actual werewolf roles
    const isActualWerewolf = player.card.name === 'Loup-Garou' || player.card.name === 'Infect père des loups';

    // Include infected players (check by team and name)
    const isInfected = player.card.team === 'Loups-Garous' || player.name.includes('(Infecté)');

    // Also check gameConfig.infectedPlayers array
    const isInInfectedArray = gameState && gameState.gameConfig &&
      gameState.gameConfig.infectedPlayers &&
      gameState.gameConfig.infectedPlayers.includes(player.id);

    // Also check localStorage for recently infected players
    let isInLocalStorage = false;
    try {
      const infectedPlayerId = localStorage.getItem('infected_player_id');
      const infectedPlayersStr = localStorage.getItem('infected_players');

      if (infectedPlayerId === player.id.toString()) {
        isInLocalStorage = true;
      }

      if (infectedPlayersStr) {
        const infectedPlayers = JSON.parse(infectedPlayersStr);
        if (infectedPlayers.includes(player.id)) {
          isInLocalStorage = true;
        }
      }
    } catch (e) {
      console.error('Error checking localStorage for infected players', e);
    }

    // Return true if the player is a werewolf or infected
    return isActualWerewolf || isInfected || isInInfectedArray || isInLocalStorage;
  });

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

      {/* Infection option - Show for both Loup-Garou and Infect père des loups */}
      {nightVictim && !infectUsed && (
        <div className="mj-infect-option" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={infectVictim}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setInfectVictim(isChecked);

                // CRITICAL FIX: Update localStorage immediately to ensure consistency
                if (isChecked) {
                  localStorage.setItem('temp_infect_victim', 'true');
                } else {
                  localStorage.removeItem('temp_infect_victim');
                }

                // Log the change for debugging
                console.log(`Infection checkbox changed to: ${isChecked ? 'checked' : 'unchecked'}`);
              }}
              style={{ marginRight: '0.5rem', transform: 'scale(1.2)' }}
            />
            <span>
              <strong>Infecter au lieu de tuer</strong> - La victime rejoint l'équipe des Loups-Garous tout en conservant son rôle d'origine (pouvoir utilisable une seule fois par partie)
            </span>
          </label>
        </div>
      )}

      {/* Infection already used message */}
      {infectUsed && (
        <div className="mj-infect-used" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(128, 128, 128, 0.1)', borderRadius: '8px' }}>
          <p style={{ margin: 0 }}>
            <em>Le pouvoir d'infection a déjà été utilisé dans cette partie. Les joueurs infectés rejoignent l'équipe des Loups-Garous mais conservent leur rôle d'origine.</em>
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
              style={{
                backgroundColor: infectVictim ? '#8e44ad' : '#e74c3c',
                fontWeight: 'bold'
              }}
            >
              {infectVictim
                ? `INFECTER ${alivePlayers.find(p => p.id === nightVictim)?.name} (rejoint les Loups-Garous)`
                : `Tuer ${alivePlayers.find(p => p.id === nightVictim)?.name}`}
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
    const { nightVictim, infectVictim, witchSaveUsed, salvateurProtectedPlayer, victims, cupidonLovers } = gameState;
    let newVictims = [...victims];

    // Check if the werewolf victim was saved by the witch or protected by the Salvateur
    const savedByWitch = witchSaveUsed && nightVictim;
    const protectedBySalvateur = salvateurProtectedPlayer && nightVictim === salvateurProtectedPlayer;

    // If infection is active, don't add the victim to the victims list
    if (nightVictim && infectVictim) {
      console.log("Infection detected in handleNightEnd - skipping victim processing");

      // Return the state with infection flag set
      return {
        ...gameState,
        infectVictim: true
      };
    }
    // Otherwise, handle as normal werewolf kill
    else if (nightVictim && !savedByWitch && !protectedBySalvateur) {
      // Only add to victims if not already in the list
      if (!newVictims.includes(nightVictim)) {
        newVictims.push(nightVictim);

        // Check if the victim is a lover
        if (cupidonLovers.includes(nightVictim)) {
          // Find the other lover
          const otherLoverId = cupidonLovers.find(id => id !== nightVictim);
          if (otherLoverId && !newVictims.includes(otherLoverId)) {
            newVictims.push(otherLoverId);
          }
        }
      }
    }

    return {
      ...gameState,
      victims: newVictims,
      infectVictim: false // Reset infection choice
    };
  }
});

// Register the Infect père des loups role
registerRole({
  name: 'Infect père des loups',
  team: 'Loups-Garous',
  wakesUpAtNight: true,
  wakesUpEveryNight: true,
  wakeUpFrequency: null,
  defaultOrder: 1, // Same order as regular werewolves
  component: Werewolf, // Use the same component as regular werewolves
  shouldWakeUp: (role, currentNight) => true,
  initialize: (gameState) => ({
    ...gameState,
    nightVictim: null
  }),
  // Use the same night end handler as regular werewolves
  handleNightEnd: (gameState) => {
    // Process the night victim
    const { nightVictim, infectVictim, witchSaveUsed, salvateurProtectedPlayer, victims, cupidonLovers } = gameState;
    let newVictims = [...victims];

    // Check if the werewolf victim was saved by the witch or protected by the Salvateur
    const savedByWitch = witchSaveUsed && nightVictim;
    const protectedBySalvateur = salvateurProtectedPlayer && nightVictim === salvateurProtectedPlayer;

    // If infection is active, don't add the victim to the victims list
    if (nightVictim && infectVictim) {
      console.log("Infection detected in handleNightEnd - skipping victim processing");

      // Return the state with infection flag set
      return {
        ...gameState,
        infectVictim: true
      };
    }
    // Otherwise, handle as normal werewolf kill
    else if (nightVictim && !savedByWitch && !protectedBySalvateur) {
      // Only add to victims if not already in the list
      if (!newVictims.includes(nightVictim)) {
        newVictims.push(nightVictim);

        // Check if the victim is a lover
        if (cupidonLovers.includes(nightVictim)) {
          // Find the other lover
          const otherLoverId = cupidonLovers.find(id => id !== nightVictim);
          if (otherLoverId && !newVictims.includes(otherLoverId)) {
            newVictims.push(otherLoverId);
          }
        }
      }
    }

    return {
      ...gameState,
      victims: newVictims,
      infectVictim: false // Reset infection choice
    };
  }
});

export default Werewolf;
