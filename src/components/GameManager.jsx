import { useState, useEffect } from 'react';
import './MJPage.css';
import RoleFactory from '../roles/RoleFactory';
import { shouldRoleWakeUp } from '../roles';
import Timer from './Timer';

const GameManager = ({ gameConfig, onRestart }) => {
  // Game state
  const [gamePhase, setGamePhase] = useState('night'); // night, morning, discussion, execution
  const [currentNight, setCurrentNight] = useState(1);
  const [gameTime, setGameTime] = useState(0); // in seconds
  const [victims, setVictims] = useState([]);
  const [executed, setExecuted] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [roleQueue, setRoleQueue] = useState([]);
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(300); // 5 minutes default
  const [nightVictim, setNightVictim] = useState(null);
  const [callDeadRoles, setCallDeadRoles] = useState(false);

  // Special role states
  const [witchSaveUsed, setWitchSaveUsed] = useState(false);
  const [witchKillUsed, setWitchKillUsed] = useState(false);
  const [witchKillTarget, setWitchKillTarget] = useState(null);
  const [flutistCharmedPlayers, setFlutistCharmedPlayers] = useState([]);
  const [cupidonLovers, setCupidonLovers] = useState([]);
  const [voyanteRevealedCard, setVoyanteRevealedCard] = useState(null);
  const [showRemainingPlayers, setShowRemainingPlayers] = useState(false);
  const [hunterCanShoot, setHunterCanShoot] = useState(false);
  const [hunterVictim, setHunterVictim] = useState(null);
  const [multipleExecutions, setMultipleExecutions] = useState(false);
  const [executionTargets, setExecutionTargets] = useState([]);

  // Salvateur states
  const [salvateurProtectedPlayer, setSalvateurProtectedPlayer] = useState(null);
  const [salvateurLastProtectedPlayer, setSalvateurLastProtectedPlayer] = useState(null);

  // Track victims from the current night
  const [currentNightVictims, setCurrentNightVictims] = useState([]);

  // Timer for game duration
  useEffect(() => {
    // Load saved game time from localStorage if available
    const savedState = localStorage.getItem('werewolf_game_state') ||
      sessionStorage.getItem('werewolf_game_state');

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.gameTime) {
          setGameTime(parsedState.gameTime);
        }
      } catch (error) {
        console.error('Error loading saved game time:', error);
      }
    }

    // Start the timer
    const timer = setInterval(() => {
      setGameTime(prevTime => {
        const newTime = prevTime + 1;
        // Save the updated time to localStorage every 10 seconds to avoid excessive writes
        if (newTime % 10 === 0) {
          try {
            const savedState = localStorage.getItem('werewolf_game_state');
            if (savedState) {
              const parsedState = JSON.parse(savedState);
              parsedState.gameTime = newTime;
              localStorage.setItem('werewolf_game_state', JSON.stringify(parsedState));
              sessionStorage.setItem('werewolf_game_state', JSON.stringify(parsedState));
            }
          } catch (error) {
            console.error('Error saving game time:', error);
          }
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize role queue for night phase
  useEffect(() => {
    if (gamePhase === 'night') {
      const initNightPhase = async () => {
        try {
          // Reset night victim selection when entering night phase
          setNightVictim(null);

          // Get roles in the correct order based on admin panel configuration
          const roles = await determineNightRoles();

          // Set the role queue with the ordered roles
          setRoleQueue(roles);

          if (roles.length > 0) {
            // Always start with the first role in the ordered list
            setCurrentRole(roles[0]);
          } else {
            // No roles to call, end the night
            handleNightComplete();
          }
        } catch (error) {
          console.error('Error initializing night phase:', error);
          // Fallback to a simple night phase without role calls
          handleNightComplete();
        }
      };

      initNightPhase();
    }
  }, [gamePhase, currentNight]);

  // Determine which roles wake up on the current night
  const determineNightRoles = async () => {
    const { players, variant } = gameConfig;
    const alivePlayers = players.filter(player => !victims.includes(player.id) && !executed.includes(player.id));

    // If callDeadRoles is false, only consider alive players
    const eligiblePlayers = callDeadRoles ? players : alivePlayers;

    // First, try to fetch the wake-up order from the server
    // We do this first to ensure we have the order configuration before filtering roles
    let orderMap = {};
    let adminPanelOrder = [];
    try {
      const variantId = variant ? variant.id : 'base';
      // For base variant, includeBase should always be true
      // For other variants, it depends on whether we want to include base cards
      const includeBase = variantId === 'base' ? true : true; // Always true for now

      // Try all possible combinations to ensure we get the wake-up order
      let response;
      let data;

      // First try with the specified parameters
      response = await fetch(`http://localhost:5000/api/wake-up-order/${variantId}?includeBase=${includeBase}`);
      data = await response.json();

      if (!(data && data.order && data.order.length > 0)) {
        // If not found, try with includeBase=true (which is most likely to have data)
        response = await fetch(`http://localhost:5000/api/wake-up-order/${variantId}?includeBase=true`);
        data = await response.json();

        if (!(data && data.order && data.order.length > 0)) {
          // Last resort: try to get any wake-up order from the database
          response = await fetch(`http://localhost:5000/api/wake-up-order/base?includeBase=true`);
          data = await response.json();
        }
      }

      if (data && data.order && data.order.length > 0) {
        // Store the complete order data for reference
        adminPanelOrder = [...data.order];

        // Create a map of role names to their order number (from the admin panel)
        data.order.forEach(item => {
          // Store the order number for each role name
          orderMap[item.name] = parseInt(item.order, 10);
        });
      } else {
        // Create a default order based on traditional Werewolf rules
        const defaultOrder = [
          { name: 'Loup-Garou', order: 1 },
          { name: 'Voyante', order: 2 },
          { name: 'Sorcière', order: 3 },
          { name: 'Chasseur', order: 4 },
          { name: 'Petite Fille', order: 5 },
          { name: 'Voleur', order: 6 },
          { name: 'Loup-Garou Blanc', order: 7 },
          { name: 'Joueur de Flûte', order: 8 },
          { name: 'Cupidon', order: 9 }
        ];

        adminPanelOrder = defaultOrder;

        // Create the order map from the default order
        defaultOrder.forEach(item => {
          orderMap[item.name] = item.order;
        });
      }
    } catch (error) {
      console.error('Error fetching wake-up order:', error);
      // If there's an error, we'll use a default order
      const defaultOrder = [
        { name: 'Loup-Garou', order: 1 },
        { name: 'Voyante', order: 2 },
        { name: 'Sorcière', order: 3 },
        { name: 'Chasseur', order: 4 },
        { name: 'Petite Fille', order: 5 },
        { name: 'Voleur', order: 6 },
        { name: 'Loup-Garou Blanc', order: 7 },
        { name: 'Joueur de Flûte', order: 8 },
        { name: 'Cupidon', order: 9 }
      ];

      adminPanelOrder = defaultOrder;

      // Create the order map from the default order
      defaultOrder.forEach(item => {
        orderMap[item.name] = item.order;
      });
    }

    // Get all eligible players with their roles
    const allEligibleRoles = eligiblePlayers
      .filter(player => {
        const card = player.card;
        // Use our helper function to determine if the role should wake up
        return shouldRoleWakeUp(card, currentNight);
      })
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        card: player.card,
        // Assign order number from the admin panel configuration
        orderNumber: orderMap[player.card.name] || 999 // Default to high number if not found
      }));

    // Group by role name to avoid calling the same role multiple times
    const roleGroups = {};

    allEligibleRoles.forEach(role => {
      const roleName = role.card.name;
      if (!roleGroups[roleName]) {
        roleGroups[roleName] = [];
      }
      roleGroups[roleName].push(role);
    });

    // Convert to array of roles (one per role type)
    // We'll select a representative player for each role type
    // Important: Preserve the orderNumber from the admin panel
    let roles = Object.entries(roleGroups).map(([roleName, players]) => {
      // For each role type, find the player with the lowest player ID
      // This ensures consistency in who represents each role
      const sortedPlayers = [...players].sort((a, b) => a.playerId - b.playerId);
      const representativePlayer = sortedPlayers[0];

      // Get the order number from the admin panel configuration
      const orderNumber = orderMap[roleName] || 999;

      return {
        ...representativePlayer,
        orderNumber: orderNumber, // Explicitly set the order number
        playersWithRole: players.map(r => ({
          playerId: r.playerId,
          playerName: r.playerName
        }))
      };
    });

    // Create a more robust sorting mechanism that strictly follows the admin panel order
    const orderedRoles = [...roles].sort((a, b) => {
      // If both roles have valid order numbers from the admin panel
      if (a.orderNumber !== 999 && b.orderNumber !== 999) {
        return a.orderNumber - b.orderNumber;
      }

      // If only a has a valid order number, it comes first
      if (a.orderNumber !== 999 && b.orderNumber === 999) {
        return -1;
      }

      // If only b has a valid order number, it comes first
      if (a.orderNumber === 999 && b.orderNumber !== 999) {
        return 1;
      }

      // If neither has a valid order number, maintain original order
      return 0;
    });

    return orderedRoles;
  };

  // Format time as HH:MM:SS
  const formatGameTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle next role in night phase
  const handleNextRole = () => {
    // Check if we're on the werewolf role and save the victim
    if (currentRole?.card?.team === 'Loups-Garous') {
      // Make sure the night victim is saved
      try {
        if (nightVictim) {
          localStorage.setItem('temp_night_victim', nightVictim.toString());
        }
      } catch (e) {
        console.error('Failed to save night victim to localStorage', e);
      }
    }

    // Save the current game state before moving to the next role
    saveGameState();

    const currentIndex = roleQueue.findIndex(role => role === currentRole);

    if (currentIndex < roleQueue.length - 1) {
      setCurrentRole(roleQueue[currentIndex + 1]);
    } else {
      // End of night phase
      handleNightComplete();
    }
  };

  // Handle previous role in night phase
  const handlePrevRole = () => {
    const currentIndex = roleQueue.findIndex(role => role === currentRole);

    if (currentIndex > 0) {
      setCurrentRole(roleQueue[currentIndex - 1]);
    }
  };

  // Handle night phase completion
  const handleNightComplete = () => {
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
          // Get the names for the alert
          const victim = gameConfig.players.find(p => p.id === nightVictim)?.name;
          const lover = gameConfig.players.find(p => p.id === otherLoverId)?.name;

          // Show alert to warn the MJ
          alert(`⚠️ ATTENTION ⚠️\n\n${victim} était amoureux avec ${lover}.\n\n${lover} meurt de chagrin !`);

          newVictims.push(otherLoverId);
        }
      }
    }

    // Process witch kill if used
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
          // Get the names for the alert
          const victim = gameConfig.players.find(p => p.id === witchKillTarget)?.name;
          const lover = gameConfig.players.find(p => p.id === otherLoverId)?.name;

          // Show alert to warn the MJ
          alert(`⚠️ ATTENTION ⚠️\n\n${victim} était amoureux avec ${lover}.\n\n${lover} meurt de chagrin !`);

          newVictims.push(otherLoverId);
        }
      }
    }

    // Check if hunter was killed by werewolves or witch
    const hunterKilledByWerewolves = nightVictim &&
      gameConfig.players.find(p => p.id === nightVictim)?.card.name === 'Chasseur' &&
      !savedByWitch;

    const hunterKilledByWitch = witchKillTarget &&
      gameConfig.players.find(p => p.id === witchKillTarget)?.card.name === 'Chasseur';

    const hunterKilled = hunterKilledByWerewolves || hunterKilledByWitch;

    if (hunterKilled) {
      setHunterCanShoot(true);
    }

    // Track the current night's victims separately
    let currentNightVictimsList = [];

    // Add werewolf victim if not saved by witch and not protected by Salvateur
    if (nightVictim && !savedByWitch && !protectedBySalvateur && !currentNightVictimsList.includes(nightVictim)) {
      currentNightVictimsList.push(nightVictim);
    }

    // Add witch kill target if used
    if (witchKillTarget && !currentNightVictimsList.includes(witchKillTarget)) {
      currentNightVictimsList.push(witchKillTarget);
    }

    // Add lovers who died of heartbreak
    newVictims.forEach(victimId => {
      if (!victims.includes(victimId) && !currentNightVictimsList.includes(victimId)) {
        currentNightVictimsList.push(victimId);
      }
    });

    // Update victims list and current night victims
    setVictims(newVictims);
    setCurrentNightVictims(currentNightVictimsList);

    // Reset night victim and witch kill target for the next night
    // This fixes the bug where the witch's target persists across nights
    setNightVictim(null);
    setWitchKillTarget(null);

    // Keep track of the last protected player but reset the current protection
    if (salvateurProtectedPlayer) {
      setSalvateurLastProtectedPlayer(salvateurProtectedPlayer);
    }
    setSalvateurProtectedPlayer(null);

    // Save game state before changing phase
    saveGameState();

    // Move to morning phase
    setGamePhase('morning');
  };

  // Handle morning phase completion
  const handleMorningComplete = () => {
    setGamePhase('discussion');
    setShowTimer(false); // Don't show timer automatically
  };

  // Get alive players
  const getAlivePlayers = () => {
    return gameConfig.players.filter(player =>
      !victims.includes(player.id) && !executed.includes(player.id)
    );
  };

  // Check if a player is in love
  const isPlayerInLove = (playerId) => {
    return cupidonLovers.includes(playerId);
  };

  // Check if game is over
  const isGameOver = () => {
    const alivePlayers = getAlivePlayers();

    // Check for different teams
    const aliveWerewolves = alivePlayers.filter(player =>
      player.card.team === 'Loups-Garous'
    );

    const aliveVillagers = alivePlayers.filter(player =>
      player.card.team === 'Village'
    );

    const aliveSolitaires = alivePlayers.filter(player =>
      player.card.team === 'Solitaire'
    );

    // Check for specific solitary roles
    const aliveFlutist = alivePlayers.some(player =>
      player.card.name === 'Joueur de Flûte'
    );

    const aliveWhiteWerewolf = alivePlayers.some(player =>
      player.card.name === 'Loup-Garou Blanc'
    );

    // Check for lovers
    const aliveLovers = alivePlayers.filter(player =>
      cupidonLovers.includes(player.id)
    );

    // Check if only the lovers are alive (lovers win)
    if (alivePlayers.length === 2 && aliveLovers.length === 2) {
      return true; // Lovers win
    }

    // Game is over if:
    // 1. No more werewolves (village wins, unless solitary roles remain)
    // 2. No more villagers (werewolves win, unless solitary roles remain)
    // 3. Only one player left and it's a solitary role
    // 4. Only the two lovers remain alive

    if (alivePlayers.length === 1 && aliveSolitaires.length === 1) {
      return true; // Solitary role wins
    }

    if (aliveWerewolves.length === 0 && aliveFlutist) {
      return false; // Game continues if Flutist is alive
    }

    if (aliveWerewolves.length === 0 && aliveWhiteWerewolf) {
      return false; // Game continues if White Werewolf is alive
    }

    return aliveWerewolves.length === 0 || aliveVillagers.length === 0;
  };

  // Save game state to localStorage
  const saveGameState = () => {
    if (!gameConfig) return;

    const gameState = {
      gameId: gameConfig.gameId || Date.now(), // Unique ID for this game
      gameConfig: gameConfig,
      gamePhase,
      currentNight,
      gameTime,
      victims,
      executed,
      witchSaveUsed,
      witchKillUsed,
      witchKillTarget,
      flutistCharmedPlayers,
      cupidonLovers,
      hunterCanShoot,
      hunterVictim,
      voyanteRevealedCard,
      nightVictim,
      roleQueue,
      currentRole,
      showTimer,
      timerDuration,
      callDeadRoles,
      multipleExecutions,
      executionTargets,
      showRemainingPlayers,
      salvateurProtectedPlayer,
      salvateurLastProtectedPlayer,
      currentNightVictims
    };

    try {
      localStorage.setItem('werewolf_game_state', JSON.stringify(gameState));
      // Also save to sessionStorage as a backup
      sessionStorage.setItem('werewolf_game_state', JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

  // Render night phase
  const renderNightPhase = () => (
    <div className="mj-phase mj-night-phase">
      <div className="mj-phase-header">
        <span className="mj-phase-indicator mj-night-phase">Phase de Nuit {currentNight}</span>
        <div className="mj-night-actions">
          <button
            className="mj-btn mj-btn-secondary"
            onClick={() => setShowWakeUpOrder(!showWakeUpOrder)}
          >
            {showWakeUpOrder ? 'Masquer l\'ordre' : 'Voir l\'ordre de réveil'}
          </button>
        </div>
      </div>

      {showWakeUpOrder && roleQueue.length > 0 && (
        <div className="mj-wake-up-order">
          <h4>Ordre de réveil complet :</h4>
          <div className="mj-wake-up-list">
            {roleQueue.map((role, index) => (
              <div
                key={role.playerId}
                className={`mj-wake-up-item ${role === currentRole ? 'current' : ''} ${roleQueue.indexOf(role) < roleQueue.indexOf(currentRole) ? 'completed' : ''}`}
              >
                <span className="mj-wake-up-number">{index + 1}</span>
                <span className="mj-wake-up-role-name">{role.card.name}</span>
                <span className="mj-wake-up-player-name">({role.playerName})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentRole && (
        <div className="mj-role-card">
          <div className="mj-role-header">
            <div className="mj-role-position">
              {roleQueue.indexOf(currentRole) + 1}/{roleQueue.length}
            </div>
            <h3>{currentRole.card.name} - {currentRole.playerName}</h3>
          </div>

          <p>{currentRole.card.description}</p>

          {/* Use the RoleFactory to render the appropriate role component */}
          <RoleFactory
            role={currentRole.card}
            player={{
              id: currentRole.playerId,
              name: currentRole.playerName
            }}
            onActionComplete={handleNextRole}
            onPrevRole={handlePrevRole}
            alivePlayers={getAlivePlayers()}
            getAlivePlayers={getAlivePlayers}
            currentNight={currentNight}
            gameState={{
              nightVictim,
              witchSaveUsed,
              witchKillUsed,
              witchKillTarget,
              flutistCharmedPlayers,
              cupidonLovers,
              voyanteRevealedCard,
              salvateurProtectedPlayer,
              salvateurLastProtectedPlayer,
              victims,
              executed
            }}
            updateGameState={(newState) => {
              // Update the game state based on the role's actions
              if (newState.nightVictim !== undefined) setNightVictim(newState.nightVictim);
              if (newState.witchSaveUsed !== undefined) setWitchSaveUsed(newState.witchSaveUsed);
              if (newState.witchKillUsed !== undefined) setWitchKillUsed(newState.witchKillUsed);
              if (newState.witchKillTarget !== undefined) setWitchKillTarget(newState.witchKillTarget);
              if (newState.flutistCharmedPlayers !== undefined) setFlutistCharmedPlayers(newState.flutistCharmedPlayers);
              if (newState.cupidonLovers !== undefined) setCupidonLovers(newState.cupidonLovers);
              if (newState.voyanteRevealedCard !== undefined) setVoyanteRevealedCard(newState.voyanteRevealedCard);
              if (newState.salvateurProtectedPlayer !== undefined) setSalvateurProtectedPlayer(newState.salvateurProtectedPlayer);
              if (newState.salvateurLastProtectedPlayer !== undefined) setSalvateurLastProtectedPlayer(newState.salvateurLastProtectedPlayer);
            }}
            isDead={victims.includes(currentRole.playerId) || executed.includes(currentRole.playerId)}
          />
        </div>
      )}

      {roleQueue.length === 0 && (
        <div className="mj-info-card">
          <p>Aucun rôle ne se réveille cette nuit.</p>
          <button
            className="mj-btn"
            onClick={() => setGamePhase('morning')}
          >
            Passer à l'aube
          </button>
        </div>
      )}
    </div>
  );

  // Render morning phase
  const renderMorningPhase = () => (
    <div className="mj-phase mj-morning-phase">
      <div className="mj-phase-header">
        <span className="mj-phase-indicator mj-morning-phase">Aube du jour {currentNight}</span>
      </div>

      <div className="mj-morning-summary">
        <h3>Récapitulatif de la nuit</h3>

        {currentNightVictims.length > 0 ? (
          <div className="mj-victims-list">
            <h4>Victimes de la nuit :</h4>
            <ul>
              {currentNightVictims.map(victimId => {
                const victim = gameConfig.players.find(p => p.id === victimId);
                return (
                  <li key={victimId} className="mj-victim-item">
                    <strong>{victim?.name}</strong> ({victim?.card.name})
                    {cupidonLovers.includes(victimId) && (
                      <span className="mj-lover-indicator"> ❤️</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="mj-no-victims">Aucune victime cette nuit.</p>
        )}

        {hunterCanShoot && (
          <div className="mj-hunter-action">
            <h4>Le Chasseur peut tirer</h4>
            <p>Le Chasseur a été tué et peut tirer sur un joueur.</p>
            <div className="mj-player-selection">
              {getAlivePlayers().map(player => (
                <button
                  key={player.id}
                  className={`mj-player-btn ${hunterVictim === player.id ? 'selected' : ''}`}
                  onClick={() => setHunterVictim(player.id)}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mj-morning-actions">
          <button
            className="mj-btn"
            onClick={() => {
              // If hunter can shoot but hasn't selected a victim, show an alert
              if (hunterCanShoot && !hunterVictim) {
                alert("Le Chasseur doit choisir une cible avant de continuer.");
                return;
              }

              // If hunter shot someone, add them to the victims
              if (hunterVictim) {
                setVictims(prev => {
                  if (!prev.includes(hunterVictim)) {
                    return [...prev, hunterVictim];
                  }
                  return prev;
                });

                // Reset hunter state
                setHunterCanShoot(false);
                setHunterVictim(null);
              }

              // Increment night counter
              setCurrentNight(prev => prev + 1);

              // Move to discussion phase
              handleMorningComplete();
            }}
          >
            Passer à la discussion
          </button>
        </div>
      </div>
    </div>
  );

  // Render discussion phase
  const renderDiscussionPhase = () => (
    <div className="mj-phase mj-discussion-phase">
      <div className="mj-phase-header">
        <span className="mj-phase-indicator mj-discussion-phase">Discussion du jour {currentNight - 1}</span>
      </div>

      <div className="mj-discussion-controls">
        <div className="mj-timer-controls">
          <h3>Minuteur de discussion</h3>
          <div className="mj-timer-buttons">
            <button
              className="mj-btn"
              onClick={() => setShowTimer(true)}
            >
              Démarrer un minuteur
            </button>
            <div className="mj-timer-duration">
              <label htmlFor="timerDuration">Durée:</label>
              <select
                id="timerDuration"
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value, 10))}
              >
                <option value="60">1 minute</option>
                <option value="120">2 minutes</option>
                <option value="180">3 minutes</option>
                <option value="300">5 minutes</option>
                <option value="600">10 minutes</option>
              </select>
              <input
                type="number"
                min="10"
                max="3600"
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value, 10))}
                placeholder="Durée personnalisée (secondes)"
                style={{ marginLeft: '10px', width: '120px' }}
              />
            </div>
          </div>

          {showTimer && (
            <div className="mj-timer-container">
              <Timer
                initialTime={timerDuration}
                onComplete={() => setShowTimer(false)}
                onCancel={() => setShowTimer(false)}
              />
            </div>
          )}
        </div>

        <div className="mj-phase-actions">
          <button
            className="mj-btn"
            onClick={() => {
              // Move to execution phase
              setGamePhase('execution');
            }}
          >
            Passer au vote
          </button>
          <button
            className="mj-btn mj-btn-secondary"
            onClick={() => {
              // Skip execution and move directly to night phase
              setGamePhase('night');
            }}
          >
            Passer directement à la nuit
          </button>
        </div>
      </div>
    </div>
  );

  // Render execution phase
  const renderExecutionPhase = () => (
    <div className="mj-phase mj-execution-phase">
      <div className="mj-phase-header">
        <span className="mj-phase-indicator mj-execution-phase">Vote du jour {currentNight - 1}</span>
      </div>

      <div className="mj-execution-controls">
        <h3>Sélectionnez le(s) joueur(s) à exécuter</h3>

        <div className="mj-execution-options">
          <div className="mj-checkbox-group">
            <input
              type="checkbox"
              id="multipleExecutions"
              checked={multipleExecutions}
              onChange={() => {
                const newValue = !multipleExecutions;
                console.log('Setting multipleExecutions to:', newValue);
                setMultipleExecutions(newValue);
              }}
            />
            <label htmlFor="multipleExecutions">
              Exécutions multiples {multipleExecutions ? '(Activé)' : '(Désactivé)'}
            </label>
          </div>
        </div>

        <div className="mj-player-selection">
          {getAlivePlayers().map(player => (
            <button
              key={player.id}
              className={`mj-player-btn ${executionTargets.includes(player.id) ? 'selected' : ''}`}
              onClick={() => {
                console.log('Player button clicked, multipleExecutions:', multipleExecutions);
                if (multipleExecutions) {
                  // Toggle selection for multiple executions
                  setExecutionTargets(prev => {
                    const newTargets = prev.includes(player.id)
                      ? prev.filter(id => id !== player.id)
                      : [...prev, player.id];
                    console.log('New execution targets (multiple):', newTargets);
                    return newTargets;
                  });
                } else {
                  // Single selection
                  console.log('New execution target (single):', [player.id]);
                  setExecutionTargets([player.id]);
                }
              }}
            >
              {player.name}
              {cupidonLovers.includes(player.id) && <span className="mj-lover-indicator"> ❤️</span>}
            </button>
          ))}
        </div>

        <div className="mj-execution-actions">
          <button
            className="mj-btn"
            onClick={() => {
              // Process executions
              if (executionTargets.length === 0) {
                // No one was selected
                alert("Aucun joueur n'a été sélectionné pour l'exécution.");
                return;
              }

              // Add selected players to executed list
              setExecuted(prev => {
                const newExecuted = [...prev];

                // Process each execution target
                executionTargets.forEach(targetId => {
                  if (!newExecuted.includes(targetId)) {
                    newExecuted.push(targetId);

                    // Check if target is a lover
                    if (cupidonLovers.includes(targetId)) {
                      // Find the other lover
                      const otherLoverId = cupidonLovers.find(id => id !== targetId);
                      if (otherLoverId && !newExecuted.includes(otherLoverId) && !executionTargets.includes(otherLoverId)) {
                        // Get the names for the alert
                        const victim = gameConfig.players.find(p => p.id === targetId)?.name;
                        const lover = gameConfig.players.find(p => p.id === otherLoverId)?.name;

                        // Show alert to warn the MJ
                        alert(`⚠️ ATTENTION ⚠️\n\n${victim} était amoureux avec ${lover}.\n\n${lover} meurt de chagrin !`);

                        newExecuted.push(otherLoverId);
                      }
                    }

                    // Check if target is the hunter
                    const isHunter = gameConfig.players.find(p => p.id === targetId)?.card.name === 'Chasseur';
                    if (isHunter) {
                      setHunterCanShoot(true);
                      alert("Le Chasseur a été exécuté et peut tirer sur un joueur avant de mourir.");
                    }
                  }
                });

                return newExecuted;
              });

              // Reset execution targets
              setExecutionTargets([]);

              // If hunter can shoot, we'll handle that in the morning phase
              if (hunterCanShoot) {
                setGamePhase('morning');
              } else {
                // Move to night phase
                setGamePhase('night');
              }
            }}
          >
            Confirmer l'exécution
          </button>

          <button
            className="mj-btn mj-btn-secondary"
            onClick={() => {
              // Cancel execution and move to night phase
              setExecutionTargets([]);
              setGamePhase('night');
            }}
          >
            Annuler (pas d'exécution)
          </button>
        </div>
      </div>
    </div>
  );

  // Toggle wake-up order display
  const [showWakeUpOrder, setShowWakeUpOrder] = useState(false);

  // Debug useEffect for multipleExecutions
  useEffect(() => {
    console.log('multipleExecutions changed:', multipleExecutions);
  }, [multipleExecutions]);

  // Debug useEffect for executionTargets
  useEffect(() => {
    console.log('executionTargets changed:', executionTargets);
  }, [executionTargets]);

  return (
    <div className="mj-game-manager">
      <div className="mj-game-info">
        <div className="mj-game-stats">
          <div className="mj-stat">
            <span className="mj-stat-label">Nuit</span>
            <span className="mj-stat-value">{currentNight}</span>
          </div>
          <div className="mj-stat">
            <span className="mj-stat-label">Durée</span>
            <span className="mj-stat-value">{formatGameTime(gameTime)}</span>
          </div>
          <div className="mj-stat">
            <span className="mj-stat-label">Joueurs vivants</span>
            <span className="mj-stat-value">{getAlivePlayers().length}</span>
          </div>
        </div>

        <div className="mj-game-controls">
          <div className="mj-control-buttons">
            <button
              className="mj-btn"
              onClick={() => setShowRemainingPlayers(true)}
            >
              Joueurs restants
            </button>

            <div className="mj-checkbox-group">
              <input
                type="checkbox"
                id="callDeadRoles"
                checked={callDeadRoles}
                onChange={() => setCallDeadRoles(!callDeadRoles)}
              />
              <label htmlFor="callDeadRoles">Appeler les rôles morts</label>
            </div>
          </div>

          <button
            className="mj-btn mj-btn-danger"
            onClick={onRestart}
          >
            Terminer la partie
          </button>
        </div>
      </div>

      {gamePhase === 'night' && renderNightPhase()}
      {gamePhase === 'morning' && renderMorningPhase()}
      {gamePhase === 'discussion' && renderDiscussionPhase()}
      {gamePhase === 'execution' && renderExecutionPhase()}

      {/* Remaining Players Modal */}
      {showRemainingPlayers && (
        <div className="mj-modal">
          <div className="mj-modal-content">
            <div className="mj-modal-header">
              <h3>Joueurs restants</h3>
              <button
                className="mj-modal-close"
                onClick={() => setShowRemainingPlayers(false)}
              >
                ×
              </button>
            </div>
            <div className="mj-modal-body">
              <div className="mj-remaining-players">
                {getAlivePlayers().map(player => (
                  <div key={player.id} className="mj-remaining-player">
                    <div className="mj-remaining-player-name">
                      {player.name}
                      {cupidonLovers.includes(player.id) && <span className="mj-lover-indicator"> ❤️</span>}
                    </div>
                    <div className="mj-remaining-player-card">
                      <div className="mj-remaining-player-role">
                        {player.card.name}
                      </div>
                      <div className={`mj-card-team-small ${player.card.team.toLowerCase()}`}>
                        {player.card.team}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameManager;
