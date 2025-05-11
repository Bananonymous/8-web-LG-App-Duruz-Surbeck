import { useState, useEffect } from 'react';
import Timer from './Timer';
import './MJPage.css';

const GameManager = ({ gameConfig, onRestart, onGameConfigUpdate }) => {
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
  const [callDeadRoles, setCallDeadRoles] = useState(true);

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

  // Timer for game duration
  useEffect(() => {
    const timer = setInterval(() => {
      setGameTime(prevTime => prevTime + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize role queue for night phase
  useEffect(() => {
    if (gamePhase === 'night') {
      const initNightPhase = async () => {
        try {
          console.log(`Initializing night phase for night ${currentNight}...`);

          // Debug: Log all players and their cards before determining night roles
          console.log('All players before determining night roles:', gameConfig.players.map(p => ({
            name: p.name,
            card: p.card.name,
            wakes_up_at_night: p.card.wakes_up_at_night,
            type: typeof p.card.wakes_up_at_night
          })));

          // Get roles in the correct order based on admin panel configuration
          const roles = await determineNightRoles();

          console.log(`Night roles determined:`, roles.map(r => ({
            name: r.card.name,
            player: r.playerName,
            playerId: r.playerId,
            orderNumber: r.orderNumber,
            wakes_up_at_night: r.card.wakes_up_at_night,
            wakes_up_every_night: r.card.wakes_up_every_night
          })));

          // Additional debug log to verify the order
          console.log('FINAL ROLE ORDER FOR NIGHT PHASE:');
          roles.forEach((role, index) => {
            console.log(`${index + 1}. ${role.card.name} (Player: ${role.playerName}, Admin Order: ${role.orderNumber || 'N/A'})`);
          });

          // Set the role queue with the ordered roles
          setRoleQueue(roles);

          if (roles.length > 0) {
            // Always start with the first role in the ordered list
            console.log(`Setting current role to: ${roles[0].card.name} (${roles[0].playerName})`);
            setCurrentRole(roles[0]);
          } else {
            console.log('No roles to call, ending the night');
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

    // Debug: Log all players and their cards
    console.log('All players:', players.map(p => ({
      name: p.name,
      card: p.card.name,
      wakes_up_at_night: p.card.wakes_up_at_night,
      wakes_up_every_night: p.card.wakes_up_every_night,
      wake_up_frequency: p.card.wake_up_frequency,
      type: typeof p.card.wakes_up_at_night
    })));

    // First, try to fetch the wake-up order from the server
    // We do this first to ensure we have the order configuration before filtering roles
    let orderMap = {};
    let adminPanelOrder = [];
    try {
      const variantId = variant ? variant.id : 'base';
      // For base variant, includeBase should always be true
      // For other variants, it depends on whether we want to include base cards
      const includeBase = variantId === 'base' ? true : true; // Always true for now

      console.log(`Fetching wake-up order for variant: ${variantId}, includeBase: ${includeBase}`);
      console.log('API URL:', `http://localhost:5000/api/wake-up-order/${variantId}?includeBase=${includeBase}`);

      // Try all possible combinations to ensure we get the wake-up order
      let response;
      let data;

      // First try with the specified parameters
      response = await fetch(`http://localhost:5000/api/wake-up-order/${variantId}?includeBase=${includeBase}`);
      console.log('API Response status (primary):', response.status);

      data = await response.json();
      console.log('API Response data (primary):', data);

      if (!(data && data.order && data.order.length > 0)) {
        // If not found, try with includeBase=true (which is most likely to have data)
        console.log('No wake-up order found with primary parameters, trying with includeBase=true');
        response = await fetch(`http://localhost:5000/api/wake-up-order/${variantId}?includeBase=true`);
        console.log('API Response status (fallback):', response.status);

        data = await response.json();
        console.log('API Response data (fallback):', data);

        if (!(data && data.order && data.order.length > 0)) {
          // Last resort: try to get any wake-up order from the database
          console.log('No wake-up order found with fallback parameters, trying to get any wake-up order');
          response = await fetch(`http://localhost:5000/api/wake-up-order/base?includeBase=true`);
          console.log('API Response status (last resort):', response.status);

          data = await response.json();
          console.log('API Response data (last resort):', data);

          if (!(data && data.order && data.order.length > 0)) {
            console.log('No wake-up order found in any configuration');
          }
        }
      }

      if (data && data.order && data.order.length > 0) {
        console.log('Wake-up order from server:', data.order);

        // Store the complete order data for reference
        adminPanelOrder = [...data.order];

        // Create a map of role names to their order number (from the admin panel)
        data.order.forEach(item => {
          // Store the order number for each role name
          orderMap[item.name] = parseInt(item.order, 10);
        });

        console.log('Order map created from admin panel configuration:', orderMap);
        console.log('Complete admin panel order:', adminPanelOrder);

        // Log the order we'll be using for the night phase
        console.log('WAKE-UP ORDER THAT WILL BE USED:');
        adminPanelOrder.forEach(item => {
          console.log(`${item.name}: Order ${item.order}`);
        });
      } else {
        console.log('No wake-up order found in the database, will use default order');

        // Create a default order based on traditional Werewolf rules
        console.log('Creating default wake-up order based on traditional rules');
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

        console.log('Default order map created:', orderMap);
      }
    } catch (error) {
      console.error('Error fetching wake-up order:', error);
      // If there's an error, we'll use a default order
      console.log('Error occurred, creating default wake-up order');
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

      console.log('Default order map created due to error:', orderMap);
    }

    // Get all eligible players with their roles
    const allEligibleRoles = eligiblePlayers
      .filter(player => {
        const card = player.card;

        // Debug: Log the card being checked
        console.log(`Checking card ${card.name}:`, {
          wakes_up_at_night: card.wakes_up_at_night,
          type: typeof card.wakes_up_at_night
        });

        // Check if the card wakes up at night (handle both boolean and numeric values)
        if (card.wakes_up_at_night !== true && card.wakes_up_at_night !== 1) {
          console.log(`${card.name} does not wake up at night`);
          return false;
        }

        // Check if the card wakes up every night (handle both boolean and numeric values)
        if (card.wakes_up_every_night === true || card.wakes_up_every_night === 1) {
          console.log(`${card.name} wakes up every night`);
          return true;
        }

        // Special handling for Cupidon - only on first night
        if (card.name === 'Cupidon') {
          console.log('Checking Cupidon role, current night:', currentNight);
          return currentNight === 1;
        }

        // Check wake up frequency
        if (card.wake_up_frequency) {
          if (card.wake_up_frequency === 'first_night_only' && currentNight === 1) {
            return true;
          }

          if (card.wake_up_frequency === '1/2' && currentNight % 2 === 1) {
            return true;
          }

          if (card.wake_up_frequency === '1/3' && currentNight % 3 === 1) {
            return true;
          }

          if (card.wake_up_frequency === '1/4' && currentNight % 4 === 1) {
            return true;
          }
        }

        return false;
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

      console.log(`Role ${roleName} has admin panel order: ${orderNumber}`);

      return {
        ...representativePlayer,
        orderNumber: orderNumber, // Explicitly set the order number
        playersWithRole: players.map(r => ({
          playerId: r.playerId,
          playerName: r.playerName
        }))
      };
    });

    // Log the roles with their order numbers
    console.log('Roles with order numbers:', roles.map(r => ({
      name: r.card.name,
      orderNumber: r.orderNumber,
      player: r.playerName
    })));

    // Create a more robust sorting mechanism that strictly follows the admin panel order
    const orderedRoles = [...roles].sort((a, b) => {
      console.log(`Comparing ${a.card.name} (${a.orderNumber}) with ${b.card.name} (${b.orderNumber})`);

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

    console.log('Final role order after sorting:', orderedRoles.map(r =>
      `${r.card.name} (order: ${r.orderNumber}, player: ${r.playerName})`
    ));

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
    console.log('Moving to next role');
    console.log('Current role:', currentRole?.card?.name);
    console.log('Current night victim:', nightVictim);

    // Check if we're on the werewolf role and save the victim
    if (currentRole?.card?.team === 'Loups-Garous') {
      console.log('Werewolf role is confirming victim:', nightVictim);

      // Make sure the night victim is saved
      try {
        if (nightVictim) {
          localStorage.setItem('temp_night_victim', nightVictim.toString());
        }
      } catch (e) {
        console.error('Failed to save night victim to localStorage', e);
      }
    }

    const currentIndex = roleQueue.findIndex(role => role === currentRole);
    console.log('Current index in role queue:', currentIndex);
    console.log('Role queue length:', roleQueue.length);

    if (currentIndex < roleQueue.length - 1) {
      console.log('Moving to next role:', roleQueue[currentIndex + 1]?.card?.name);
      setCurrentRole(roleQueue[currentIndex + 1]);
    } else {
      // End of night phase
      console.log('End of role queue, moving to morning phase');
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

  // Handle night victim selection
  const handleNightVictimSelect = (playerId) => {
    console.log(`Selecting night victim: ${playerId}`);
    // If the same victim is clicked again, deselect them
    if (nightVictim === playerId) {
      console.log('Deselecting current victim');
      setNightVictim(null);
    } else {
      console.log(`Setting night victim to: ${playerId}`);
      // Force a direct state update
      setNightVictim(playerId);
      // Save the selection to localStorage for backup
      try {
        localStorage.setItem('temp_night_victim', playerId.toString());
      } catch (e) {
        console.error('Failed to save night victim to localStorage', e);
      }
    }
  };

  // Handle night phase completion
  const handleNightComplete = () => {
    console.log('Night phase complete, processing victims');
    console.log('Current night victim:', nightVictim);
    console.log('Current witch kill target:', witchKillTarget);
    console.log('Witch save used:', witchSaveUsed);
    console.log('Current victims:', victims);
    console.log('Cupidon lovers:', cupidonLovers);

    let newVictims = [...victims];

    // Check if the werewolf victim was saved by the witch
    const savedByWitch = witchSaveUsed && nightVictim;
    console.log('Saved by witch:', savedByWitch);

    // Only add werewolf victim if not saved by witch
    if (nightVictim && !savedByWitch) {
      console.log(`Adding werewolf victim ${nightVictim} to victims list`);
      newVictims.push(nightVictim);

      // Check if the victim is a lover
      if (cupidonLovers.includes(nightVictim)) {
        // Find the other lover
        const otherLoverId = cupidonLovers.find(id => id !== nightVictim);
        if (otherLoverId && !newVictims.includes(otherLoverId)) {
          console.log(`Adding lover ${otherLoverId} to victims list (died of heartbreak)`);

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
      console.log(`Adding witch kill target ${witchKillTarget} to victims list`);
      newVictims.push(witchKillTarget);

      // Check if the witch's target is a lover
      if (cupidonLovers.includes(witchKillTarget)) {
        // Find the other lover
        const otherLoverId = cupidonLovers.find(id => id !== witchKillTarget);
        if (otherLoverId && !newVictims.includes(otherLoverId)) {
          console.log(`Adding lover ${otherLoverId} to victims list (died of heartbreak)`);

          // Get the names for the alert
          const victim = gameConfig.players.find(p => p.id === witchKillTarget)?.name;
          const lover = gameConfig.players.find(p => p.id === otherLoverId)?.name;

          // Show alert to warn the MJ
          alert(`⚠️ ATTENTION ⚠️\n\n${victim} était amoureux avec ${lover}.\n\n${lover} meurt de chagrin !`);

          newVictims.push(otherLoverId);
        }
      }
    }

    // Check if hunter was killed
    const hunterKilled = nightVictim &&
      gameConfig.players.find(p => p.id === nightVictim)?.card.name === 'Chasseur' &&
      !savedByWitch;
    console.log('Hunter killed:', hunterKilled);

    if (hunterKilled) {
      setHunterCanShoot(true);
    }

    // Update victims list and move to morning phase
    console.log('New victims list:', newVictims);
    setVictims(newVictims);

    // Save game state before changing phase
    saveGameState();

    // Move to morning phase
    setGamePhase('morning');
  };

  // Handle witch save
  const handleWitchSave = () => {
    // Mark save power as used
    setWitchSaveUsed(true);
  };

  // Handle witch kill
  const handleWitchKill = (playerId) => {
    setWitchKillTarget(playerId);
    setWitchKillUsed(true);
  };

  // Handle witch potions complete
  const handleWitchPotionsComplete = () => {
    handleNextRole();
  };

  // Handle flutist charm
  const handleFlutistCharm = (playerIds) => {
    setFlutistCharmedPlayers([...flutistCharmedPlayers, ...playerIds]);
    handleNextRole();
  };

  // This function is now handled directly in the UI

  // Handle morning phase completion
  const handleMorningComplete = () => {
    setGamePhase('discussion');
    setShowTimer(false); // Don't show timer automatically
  };

  // Handle discussion phase completion
  const handleDiscussionComplete = () => {
    setShowTimer(false);
    setGamePhase('execution');
  };

  // Handle execution target selection
  const handleExecutionTargetSelect = (playerId) => {
    if (multipleExecutions) {
      // Toggle selection for multiple executions
      if (executionTargets.includes(playerId)) {
        setExecutionTargets(executionTargets.filter(id => id !== playerId));
      } else {
        setExecutionTargets([...executionTargets, playerId]);
      }
    } else {
      // Single execution
      let newExecuted = [...executed, playerId];

      // Check if the executed player is a lover
      if (cupidonLovers.includes(playerId)) {
        // Find the other lover
        const otherLoverId = cupidonLovers.find(id => id !== playerId);
        if (otherLoverId && !newExecuted.includes(otherLoverId) && !victims.includes(otherLoverId)) {
          console.log(`Adding lover ${otherLoverId} to executed list (died of heartbreak)`);

          // Get the names for the alert
          const victim = gameConfig.players.find(p => p.id === playerId)?.name;
          const lover = gameConfig.players.find(p => p.id === otherLoverId)?.name;

          // Show alert to warn the MJ
          alert(`⚠️ ATTENTION ⚠️\n\n${victim} était amoureux avec ${lover}.\n\n${lover} meurt de chagrin !`);

          newExecuted.push(otherLoverId);
        }
      }

      setExecuted(newExecuted);

      // Check if hunter was executed
      const hunterExecuted = gameConfig.players.find(p => p.id === playerId)?.card.name === 'Chasseur';
      if (hunterExecuted) {
        setHunterCanShoot(true);
        setGamePhase('hunter_revenge');
      } else {
        setGamePhase('night');
        setCurrentNight(currentNight + 1);
      }
    }
  };

  // Handle multiple executions
  const handleMultipleExecutions = () => {
    let newExecuted = [...executed];

    // Process each execution target
    for (const targetId of executionTargets) {
      // Add the target to executed list
      newExecuted.push(targetId);

      // Check if the executed player is a lover
      if (cupidonLovers.includes(targetId)) {
        // Find the other lover
        const otherLoverId = cupidonLovers.find(id => id !== targetId);
        if (otherLoverId && !newExecuted.includes(otherLoverId) && !victims.includes(otherLoverId)) {
          console.log(`Adding lover ${otherLoverId} to executed list (died of heartbreak)`);

          // Get the names for the alert
          const victim = gameConfig.players.find(p => p.id === targetId)?.name;
          const lover = gameConfig.players.find(p => p.id === otherLoverId)?.name;

          // Show alert to warn the MJ
          alert(`⚠️ ATTENTION ⚠️\n\n${victim} était amoureux avec ${lover}.\n\n${lover} meurt de chagrin !`);

          newExecuted.push(otherLoverId);
        }
      }
    }

    setExecuted(newExecuted);

    // Check if hunter was executed
    const hunterExecuted = executionTargets.some(id =>
      gameConfig.players.find(p => p.id === id)?.card.name === 'Chasseur'
    );

    if (hunterExecuted) {
      setHunterCanShoot(true);
      setGamePhase('hunter_revenge');
    } else {
      setGamePhase('night');
      setCurrentNight(currentNight + 1);
    }

    setExecutionTargets([]);
    setMultipleExecutions(false);
  };

  // Handle no execution
  const handleNoExecution = () => {
    setGamePhase('night');
    setCurrentNight(currentNight + 1);
  };

  // Handle timer selection
  const handleTimerSelect = (duration) => {
    console.log(`Setting timer duration to ${duration} seconds`);
    setTimerDuration(duration);

    // Use a small timeout to ensure state updates before showing timer
    setTimeout(() => {
      console.log('Showing timer');
      setShowTimer(true);
    }, 50);
  };

  // Handle custom timer input
  const handleCustomTimerInput = (e) => {
    const minutes = parseInt(e.target.value);
    if (!isNaN(minutes) && minutes > 0) {
      setTimerDuration(minutes * 60);
    }
  };

  // Handle custom timer start
  const handleCustomTimerStart = () => {
    console.log('Starting custom timer with duration:', timerDuration);
    if (timerDuration > 0) {
      // Use a small timeout to ensure state updates before showing timer
      setTimeout(() => {
        console.log('Showing custom timer');
        setShowTimer(true);
      }, 50);
    }
  };

  // Handle trap hunter interruption
  const handleTrapHunter = () => {
    // Interrupt the night phase
    setGamePhase('morning');
  };

  // Get alive players
  const getAlivePlayers = () => {
    return gameConfig.players.filter(player =>
      !victims.includes(player.id) && !executed.includes(player.id)
    );
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

  // Toggle wake-up order display
  const [showWakeUpOrder, setShowWakeUpOrder] = useState(false);

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
          <button
            className="mj-btn mj-btn-danger"
            onClick={handleTrapHunter}
          >
            CLAC ! Le trappeur a frappé !
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
                {role.orderNumber && role.orderNumber !== 999 && (
                  <span className="mj-wake-up-admin-order">(Ordre configuré: {role.orderNumber})</span>
                )}
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
          {victims.includes(currentRole.playerId) || executed.includes(currentRole.playerId) ? (
            <div className="mj-dead-role-alert">
              <p><strong>Attention :</strong> Ce rôle appartient à un joueur mort. Vous devez jouer ce rôle.</p>
            </div>
          ) : null}
          <p>{currentRole.card.description}</p>

          {/* Werewolves */}
          {currentRole.card.team === 'Loups-Garous' && (
            <div className="mj-victim-selection">
              <h4>Sélectionner une victime :</h4>

              {/* Current victim info */}
              <div style={{
                fontSize: '1rem',
                color: nightVictim ? '#e74c3c' : '#666',
                marginBottom: '1rem',
                padding: '0.5rem',
                border: nightVictim ? '2px solid #e74c3c' : 'none',
                borderRadius: '4px',
                fontWeight: nightVictim ? 'bold' : 'normal'
              }}>
                Victime actuelle: {nightVictim
                  ? (gameConfig.players.find(p => p.id === nightVictim)?.name || `Joueur ${nightVictim} (ID)`)
                  : 'Aucune'}
              </div>

              <div className="mj-player-grid">
                {(() => {
                  // Get potential victims (non-werewolves who are alive)
                  const potentialVictims = getAlivePlayers().filter(player => player.card.team !== 'Loups-Garous');

                  if (potentialVictims.length === 0) {
                    return <div>Aucune victime potentielle disponible</div>;
                  }

                  // Create a simple array of player buttons for better reliability
                  const playerButtons = [];

                  potentialVictims.forEach(player => {
                    const isSelected = nightVictim === player.id;

                    playerButtons.push(
                      <button
                        key={player.id}
                        className={`mj-player-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleNightVictimSelect(player.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#e74c3c' : '#f8f9fa',
                          color: isSelected ? 'white' : 'black',
                          border: isSelected ? '2px solid #c0392b' : '1px solid #dee2e6',
                          padding: '10px',
                          margin: '5px',
                          borderRadius: '4px',
                          fontWeight: isSelected ? 'bold' : 'normal'
                        }}
                      >
                        {player.name}
                      </button>
                    );
                  });

                  return playerButtons;
                })()}
              </div>

              {/* Werewolf action buttons */}
              <div className="mj-werewolf-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {nightVictim ? (
                  <>
                    <button
                      className="mj-btn"
                      onClick={() => {
                        console.log(`Confirming victim: ${nightVictim}`);
                        handleNextRole();
                      }}
                    >
                      Confirmer la victime: {gameConfig.players.find(p => p.id === nightVictim)?.name}
                    </button>
                    <button
                      className="mj-btn mj-btn-secondary"
                      onClick={() => {
                        console.log('Deselecting victim');
                        setNightVictim(null);
                      }}
                    >
                      Annuler la sélection
                    </button>
                  </>
                ) : (
                  <button
                    className="mj-btn mj-btn-secondary"
                    onClick={() => {
                      console.log('Skipping victim selection');
                      setNightVictim(null);
                      handleNextRole();
                    }}
                  >
                    Passer (pas de victime)
                  </button>
                )}


              </div>

              <div className="mj-werewolf-info">
                <h4>Loups-Garous vivants :</h4>
                <div className="mj-werewolf-list">
                  {getAlivePlayers()
                    .filter(player => player.card.team === 'Loups-Garous')
                    .map(player => (
                      <div key={player.id} className="mj-werewolf-item">
                        {player.name} ({player.card.name})
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Witch */}
          {currentRole.card.name === 'Sorcière' && (
            <div className="mj-witch-actions">
              <h3>Potions de la Sorcière</h3>

              <div className="mj-witch-potions">
                {/* Save Potion */}
                <div className={`mj-witch-potion ${witchSaveUsed ? 'used' : ''}`}>
                  <h4>Potion de Guérison {witchSaveUsed && '(Utilisée)'}</h4>
                  {nightVictim ? (
                    <div className="mj-witch-save">
                      <p>Les Loups-Garous ont choisi de dévorer :</p>
                      <div className="mj-victim-info">
                        <h4>{gameConfig.players.find(p => p.id === nightVictim)?.name}</h4>
                      </div>
                      {!witchSaveUsed && (
                        <div className="mj-witch-buttons">
                          <button
                            className="mj-btn"
                            onClick={handleWitchSave}
                          >
                            Sauver
                          </button>
                          <button
                            className="mj-btn mj-btn-secondary"
                            onClick={() => handleWitchPotionsComplete()}
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
                <div className={`mj-witch-potion ${witchKillUsed ? 'used' : ''}`}>
                  <h4>Potion de Mort {witchKillUsed && '(Utilisée)'}</h4>
                  {!witchKillUsed ? (
                    <div className="mj-witch-kill">
                      {witchKillTarget ? (
                        <div className="mj-victim-info">
                          <p>Vous avez choisi d'éliminer :</p>
                          <h4>{gameConfig.players.find(p => p.id === witchKillTarget)?.name}</h4>
                          <div className="mj-witch-buttons" style={{ marginTop: '1rem' }}>
                            <button
                              className="mj-btn"
                              onClick={handleWitchPotionsComplete}
                            >
                              Confirmer
                            </button>
                            <button
                              className="mj-btn mj-btn-secondary"
                              onClick={() => {
                                setWitchKillTarget(null);
                                setWitchKillUsed(false);
                              }}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p>Choisissez un joueur à éliminer :</p>
                          <div className="mj-player-grid">
                            {(() => {
                              const alivePlayers = getAlivePlayers();
                              const playerButtons = [];

                              alivePlayers.forEach(player => {
                                playerButtons.push(
                                  <button
                                    key={player.id}
                                    className="mj-player-item"
                                    onClick={() => handleWitchKill(player.id)}
                                    style={{
                                      cursor: 'pointer',
                                      backgroundColor: '#f8f9fa',
                                      color: 'black',
                                      border: '1px solid #dee2e6',
                                      padding: '10px',
                                      margin: '5px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {player.name}
                                  </button>
                                );
                              });

                              return playerButtons;
                            })()}
                          </div>
                          <button
                            className="mj-btn mj-btn-secondary"
                            onClick={() => handleWitchPotionsComplete()}
                          >
                            Ne pas utiliser
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <p>Potion déjà utilisée.</p>
                  )}
                </div>
              </div>

              <div className="mj-witch-continue">
                <button
                  className="mj-btn"
                  onClick={handleWitchPotionsComplete}
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Voyante */}
          {currentRole.card.name === 'Voyante' && (
            <div className="mj-voyante-action">
              {voyanteRevealedCard ? (
                <div className="mj-voyante-reveal">
                  <div className="mj-revealed-card-fullscreen" onClick={() => setVoyanteRevealedCard(null)}>
                    {voyanteRevealedCard.card.image ? (
                      <div className="mj-revealed-card-image-large">
                        <img
                          src={voyanteRevealedCard.card.image}
                          alt={voyanteRevealedCard.card.name}
                          style={{
                            maxWidth: '90vw',
                            maxHeight: '80vh',
                            borderRadius: '8px',
                            boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="mj-revealed-card-name-large">
                        {voyanteRevealedCard.card.name}
                      </div>
                    )}
                    <div className="mj-revealed-card-tap">Tapez pour fermer</div>
                  </div>
                  <button
                    className="mj-btn"
                    onClick={() => {
                      setVoyanteRevealedCard(null);
                      handleNextRole();
                    }}
                  >
                    Continuer
                  </button>
                </div>
              ) : (
                <>
                  <h4>Choisissez un joueur pour découvrir son identité :</h4>
                  <div className="mj-player-grid">
                    {getAlivePlayers()
                      // Filter out the Voyante herself
                      .filter(player => player.id !== currentRole.playerId)
                      .map(player => (
                        <div
                          key={player.id}
                          className="mj-player-item mj-voyante-player"
                          onClick={() => {
                            console.log('Voyante revealing card:', player.card);
                            console.log('Card image URL:', player.card.image);
                            setVoyanteRevealedCard({
                              playerId: player.id,
                              playerName: player.name,
                              card: player.card
                            });
                          }}
                        >
                          {player.name}
                        </div>
                      ))
                    }
                  </div>
                </>
              )}
            </div>
          )}

          {/* Flutist */}
          {currentRole.card.name === 'Joueur de Flûte' && (
            <div className="mj-flutist-action">
              <h4>Choisissez jusqu'à 2 joueurs à charmer :</h4>
              <div className="mj-player-grid">
                {getAlivePlayers()
                  .filter(player => !flutistCharmedPlayers.includes(player.id))
                  .map(player => (
                    <div
                      key={player.id}
                      className="mj-player-item"
                      onClick={() => {
                        const selectedPlayers = [player.id];
                        handleFlutistCharm(selectedPlayers);
                      }}
                    >
                      {player.name}
                    </div>
                  ))
                }
              </div>
              <button
                className="mj-btn mj-btn-secondary"
                onClick={handleNextRole}
              >
                Passer
              </button>
            </div>
          )}

          {/* Cupidon */}
          {currentRole.card.name === 'Cupidon' && (
            <div className="mj-cupidon-action">
              <h4>Choisissez deux joueurs qui seront amoureux :</h4>

              <div className="mj-info-box" style={{
                backgroundColor: 'rgba(233, 30, 99, 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <p><strong>Règles des amoureux :</strong></p>
                <ul style={{ paddingLeft: '1.5rem' }}>
                  <li>Les amoureux forment une équipe à part et doivent gagner ensemble</li>
                  <li>Si l'un des amoureux meurt, l'autre meurt de chagrin immédiatement</li>
                  <li>Pour gagner, ils doivent être les deux derniers survivants</li>
                  <li><strong>Cupidon n'intervient que lors de la première nuit</strong></li>
                </ul>
              </div>

              <div className="mj-player-grid">
                {getAlivePlayers().map(player => (
                  <div
                    key={player.id}
                    className={`mj-player-item ${cupidonLovers.includes(player.id) ? 'selected' : ''}`}
                    onClick={() => {
                      if (cupidonLovers.includes(player.id)) {
                        setCupidonLovers(cupidonLovers.filter(id => id !== player.id));
                      } else if (cupidonLovers.length < 2) {
                        setCupidonLovers([...cupidonLovers, player.id]);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: cupidonLovers.includes(player.id) ? 'rgba(233, 30, 99, 0.3)' : '#f8f9fa',
                      color: cupidonLovers.includes(player.id) ? 'white' : 'black',
                      border: cupidonLovers.includes(player.id) ? '2px solid #e91e63' : '1px solid #dee2e6',
                      padding: '10px',
                      margin: '5px',
                      borderRadius: '4px',
                      fontWeight: cupidonLovers.includes(player.id) ? 'bold' : 'normal'
                    }}
                  >
                    {player.name}
                  </div>
                ))}
              </div>

              {cupidonLovers.length === 2 && (
                <div style={{
                  marginTop: '1rem',
                  textAlign: 'center',
                  color: '#e91e63',
                  fontWeight: 'bold'
                }}>
                  {gameConfig.players.find(p => p.id === cupidonLovers[0])?.name} et {gameConfig.players.find(p => p.id === cupidonLovers[1])?.name} seront amoureux !
                </div>
              )}

              <button
                className="mj-btn"
                style={{
                  marginTop: '1rem',
                  backgroundColor: cupidonLovers.length === 2 ? '#e91e63' : undefined
                }}
                onClick={handleNextRole}
                disabled={cupidonLovers.length !== 2}
              >
                Confirmer
              </button>
            </div>
          )}

          <div className="mj-role-actions">
            <button
              className="mj-btn mj-btn-secondary"
              onClick={handlePrevRole}
              disabled={roleQueue.indexOf(currentRole) === 0}
            >
              Précédent
            </button>
            <button
              className="mj-btn"
              onClick={handleNextRole}
            >
              Suivant
            </button>
          </div>
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
  const renderMorningPhase = () => {
    // Get all victims that aren't from executions
    const allNightVictims = victims.filter(v => !executed.includes(v));

    // Get only the victims from the current night
    const lastNightVictimCount = (nightVictim && !witchSaveUsed ? 1 : 0) + (witchKillTarget ? 1 : 0);
    const lastNightVictims = allNightVictims.slice(-lastNightVictimCount);

    // Separate werewolf and witch victims for display
    const werewolfVictim = nightVictim && !witchSaveUsed ?
      gameConfig.players.find(p => p.id === nightVictim) : null;

    const witchVictim = witchKillTarget ?
      gameConfig.players.find(p => p.id === witchKillTarget) : null;

    return (
      <div className="mj-phase mj-morning-phase">
        <div className="mj-phase-header">
          <span className="mj-phase-indicator mj-morning-phase">Phase d'Aube - Jour {currentNight}</span>
        </div>

        {hunterCanShoot ? (
          <div className="mj-info-card">
            <h3>Le Chasseur a été tué</h3>
            <p>Il peut tirer une dernière balle avant de mourir :</p>

            <div className="mj-player-grid">
              {getAlivePlayers().map(player => (
                <div
                  key={player.id}
                  className={`mj-player-item ${hunterVictim === player.id ? 'selected' : ''}`}
                  onClick={() => setHunterVictim(player.id)}
                >
                  {player.name}
                </div>
              ))}
            </div>

            <div className="mj-hunter-actions">
              <button
                className="mj-btn"
                onClick={() => {
                  if (hunterVictim) {
                    setVictims([...victims, hunterVictim]);
                  }
                  setHunterCanShoot(false);
                  setHunterVictim(null);
                }}
              >
                Confirmer
              </button>
              <button
                className="mj-btn mj-btn-secondary"
                onClick={() => {
                  setHunterCanShoot(false);
                  setHunterVictim(null);
                }}
              >
                Ne pas tirer
              </button>
            </div>
          </div>
        ) : (
          <div className="mj-info-card">
            <h3>Récapitulatif de la nuit</h3>

            {lastNightVictims.length === 0 ? (
              <p>Aucune victime cette nuit.</p>
            ) : (
              <div className="mj-victims-recap">
                {werewolfVictim && (
                  <div className="mj-victim-info mj-werewolf-victim">
                    <p>Les Loups-Garous ont dévoré :</p>
                    <div className="mj-victim-item">
                      <h4>{werewolfVictim.name}</h4>
                      <p className="mj-victim-role">{werewolfVictim.card.name}</p>
                    </div>
                  </div>
                )}

                {witchVictim && (
                  <div className="mj-victim-info mj-witch-victim">
                    <p>La Sorcière a empoisonné :</p>
                    <div className="mj-victim-item">
                      <h4>{witchVictim.name}</h4>
                      <p className="mj-victim-role">{witchVictim.card.name}</p>
                    </div>
                  </div>
                )}

                {witchSaveUsed && nightVictim && (
                  <div className="mj-victim-saved">
                    <p>La Sorcière a utilisé sa potion de guérison pour sauver quelqu'un.</p>
                  </div>
                )}
              </div>
            )}

            <button
              className="mj-btn"
              onClick={handleMorningComplete}
            >
              Commencer la discussion
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render discussion phase
  const renderDiscussionPhase = () => {
    console.log('Rendering discussion phase, showTimer:', showTimer);
    console.log('Timer duration:', timerDuration);

    return (
      <div className="mj-phase mj-discussion-phase">
        <div className="mj-phase-header">
          <span className="mj-phase-indicator mj-discussion-phase">Phase de Discussion - Jour {currentNight}</span>
        </div>

        <div className="mj-info-card">
          <h3>Discussion du village</h3>

          {showTimer ? (
            <div className="mj-timer-container">
              <Timer
                key={`timer-${timerDuration}`} // Force re-render with new key
                initialTime={timerDuration}
                onComplete={handleDiscussionComplete}
                onCancel={handleDiscussionComplete}
              />
            </div>
          ) : (
            <div className="mj-timer-selection">
              <h4>Sélectionner une durée :</h4>
              <div className="mj-timer-buttons">
                <button className="mj-btn" onClick={() => handleTimerSelect(180)}>3 minutes</button>
                <button className="mj-btn" onClick={() => handleTimerSelect(300)}>5 minutes</button>
                <button className="mj-btn" onClick={() => handleTimerSelect(420)}>7 minutes</button>
                <button className="mj-btn" onClick={() => handleTimerSelect(600)}>10 minutes</button>
              </div>

              <div className="mj-custom-timer">
                <div className="mj-custom-timer-input">
                  <input
                    type="number"
                    min="1"
                    placeholder="Minutes personnalisées"
                    onChange={handleCustomTimerInput}
                  />
                  <button
                    className="mj-btn"
                    onClick={handleCustomTimerStart}
                  >
                    Démarrer
                  </button>
                </div>
                <button
                  className="mj-btn mj-btn-secondary"
                  onClick={handleDiscussionComplete}
                >
                  Passer la discussion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render execution phase
  const renderExecutionPhase = () => (
    <div className="mj-phase mj-execution-phase">
      <div className="mj-phase-header">
        <span className="mj-phase-indicator mj-execution-phase">Phase d'Exécution - Jour {currentNight}</span>
        <div className="mj-execution-mode">
          <button
            className={`mj-btn-toggle ${!multipleExecutions ? 'active' : ''}`}
            onClick={() => {
              setMultipleExecutions(false);
              setExecutionTargets([]);
            }}
          >
            Exécution simple
          </button>
          <button
            className={`mj-btn-toggle ${multipleExecutions ? 'active' : ''}`}
            onClick={() => setMultipleExecutions(true)}
          >
            Exécutions multiples
          </button>
        </div>
      </div>

      <div className="mj-info-card">
        <h3>Le village doit voter</h3>
        {multipleExecutions ? (
          <p>Sélectionnez les joueurs qui seront exécutés :</p>
        ) : (
          <p>Sélectionnez le joueur qui sera exécuté :</p>
        )}

        <div className="mj-player-grid">
          {getAlivePlayers().map(player => (
            <div
              key={player.id}
              className={`mj-player-item ${executionTargets.includes(player.id) ? 'selected' : ''}`}
              onClick={() => handleExecutionTargetSelect(player.id)}
            >
              <div className="mj-player-name">{player.name}</div>
              <div className="mj-player-role">{player.card.name}</div>
            </div>
          ))}
        </div>

        <div className="mj-execution-actions">
          {multipleExecutions ? (
            <button
              className="mj-btn"
              onClick={handleMultipleExecutions}
              disabled={executionTargets.length === 0}
            >
              Exécuter les joueurs sélectionnés
            </button>
          ) : (
            <button
              className="mj-btn"
              onClick={handleNoExecution}
            >
              Ne pas exécuter
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render hunter revenge phase
  const renderHunterRevengePhase = () => (
    <div className="mj-phase mj-hunter-phase">
      <div className="mj-phase-header">
        <span className="mj-phase-indicator mj-hunter-phase">Vengeance du Chasseur</span>
      </div>

      <div className="mj-info-card">
        <h3>Le Chasseur a été {gamePhase === 'hunter_revenge' ? 'exécuté' : 'tué'}</h3>
        <p>Il peut tirer une dernière balle avant de mourir :</p>

        <div className="mj-player-grid">
          {getAlivePlayers().map(player => (
            <div
              key={player.id}
              className={`mj-player-item ${hunterVictim === player.id ? 'selected' : ''}`}
              onClick={() => setHunterVictim(player.id)}
            >
              <div className="mj-player-name">{player.name}</div>
              <div className="mj-player-role">{player.card.name}</div>
            </div>
          ))}
        </div>

        <div className="mj-hunter-actions">
          <button
            className="mj-btn"
            onClick={() => {
              if (hunterVictim) {
                setVictims([...victims, hunterVictim]);
              }
              setHunterCanShoot(false);
              setHunterVictim(null);
              setGamePhase('night');
              setCurrentNight(currentNight + 1);
            }}
          >
            Confirmer
          </button>
          <button
            className="mj-btn mj-btn-secondary"
            onClick={() => {
              setHunterCanShoot(false);
              setHunterVictim(null);
              setGamePhase('night');
              setCurrentNight(currentNight + 1);
            }}
          >
            Ne pas tirer
          </button>
        </div>
      </div>
    </div>
  );

  // Render game over
  const renderGameOver = () => (
    <div className="mj-phase mj-game-over">
      <div className="mj-phase-header">
        <span className="mj-phase-indicator">Fin de la partie</span>
      </div>

      <div className="mj-info-card">
        <h3>La partie est terminée !</h3>

        {(() => {
          const alivePlayers = getAlivePlayers();

          // Check for lovers win
          const aliveLovers = alivePlayers.filter(player => cupidonLovers.includes(player.id));
          if (alivePlayers.length === 2 && aliveLovers.length === 2) {
            const lover1 = gameConfig.players.find(p => p.id === cupidonLovers[0]);
            const lover2 = gameConfig.players.find(p => p.id === cupidonLovers[1]);
            return (
              <div>
                <p>Les Amoureux ont gagné !</p>
                <p style={{ color: '#e91e63' }}>
                  {lover1?.name} ({lover1?.card.name}) et {lover2?.name} ({lover2?.card.name})
                  peuvent vivre leur amour en paix !
                </p>
              </div>
            );
          }

          // Check for solitary winner
          if (alivePlayers.length === 1) {
            const winner = alivePlayers[0];
            if (winner.card.team === 'Solitaire') {
              return <p>{winner.card.name} ({winner.name}) a gagné !</p>;
            }
          }

          // Check for Flutist win
          const allCharmed = gameConfig.players.length === flutistCharmedPlayers.length + 1;
          const flutistAlive = alivePlayers.some(p => p.card.name === 'Joueur de Flûte');
          if (flutistAlive && allCharmed) {
            return <p>Le Joueur de Flûte a gagné !</p>;
          }

          // Check for standard team wins
          if (alivePlayers.filter(player => player.card.team === 'Loups-Garous').length === 0) {
            return <p>Les Villageois ont gagné !</p>;
          } else {
            return <p>Les Loups-Garous ont gagné !</p>;
          }
        })()}

        <div className="mj-game-stats">
          <p>Durée de la partie : {formatGameTime(gameTime)}</p>
          <p>Nombre de nuits : {currentNight}</p>
        </div>

        <button
          className="mj-btn"
          onClick={onRestart}
        >
          Nouvelle partie
        </button>
      </div>
    </div>
  );

  // Render remaining players modal
  const renderRemainingPlayersModal = () => (
    <div className="mj-modal" onClick={() => setShowRemainingPlayers(false)}>
      <div className="mj-modal-content" onClick={e => e.stopPropagation()}>
        <div className="mj-modal-header">
          <h3>Joueurs restants</h3>
          <button className="mj-modal-close" onClick={() => setShowRemainingPlayers(false)}>×</button>
        </div>
        <div className="mj-modal-body">
          <div className="mj-remaining-players">
            {getAlivePlayers().map(player => (
              <div key={player.id} className="mj-remaining-player">
                <div className="mj-remaining-player-name">{player.name}</div>
                <div className="mj-remaining-player-card">
                  <span className="mj-remaining-player-role">{player.card.name}</span>
                  <span className={`mj-card-team-small ${player.card.team.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                    {player.card.team}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
      showRemainingPlayers
    };

    try {
      localStorage.setItem('werewolf_game_state', JSON.stringify(gameState));
      // Also save to sessionStorage as a backup
      sessionStorage.setItem('werewolf_game_state', JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

  // Save game state when important game state changes
  useEffect(() => {
    if (!gameConfig) return;

    // Use a debounced save to prevent too many saves
    const saveTimeout = setTimeout(() => {
      saveGameState();
    }, 500);

    return () => clearTimeout(saveTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, currentNight]);

  // Load game state from localStorage on mount
  useEffect(() => {
    // Try to get state from localStorage first, then sessionStorage as fallback
    const savedState = localStorage.getItem('werewolf_game_state') ||
      sessionStorage.getItem('werewolf_game_state');

    if (savedState && gameConfig) {
      try {
        const parsedState = JSON.parse(savedState);

        // Only restore if it's the same game (check gameId or players)
        const isSameGame = parsedState.gameConfig &&
          gameConfig.players &&
          parsedState.gameConfig.players &&
          parsedState.gameConfig.players.length === gameConfig.players.length;

        if (isSameGame) {
          // Restore game configuration
          // We'll skip updating the parent's gameConfig to prevent infinite loops
          // Instead, we'll just use the parsed state directly

          // Restore game state
          setGamePhase(parsedState.gamePhase || 'night');
          setCurrentNight(parsedState.currentNight || 1);
          setGameTime(parsedState.gameTime || 0);
          setVictims(parsedState.victims || []);
          setExecuted(parsedState.executed || []);
          setWitchSaveUsed(parsedState.witchSaveUsed || false);
          setWitchKillUsed(parsedState.witchKillUsed || false);
          setWitchKillTarget(parsedState.witchKillTarget || null);
          setFlutistCharmedPlayers(parsedState.flutistCharmedPlayers || []);
          setCupidonLovers(parsedState.cupidonLovers || []);
          setHunterCanShoot(parsedState.hunterCanShoot || false);
          setHunterVictim(parsedState.hunterVictim || null);
          setVoyanteRevealedCard(parsedState.voyanteRevealedCard || null);
          setNightVictim(parsedState.nightVictim || null);
          setRoleQueue(parsedState.roleQueue || []);
          setCurrentRole(parsedState.currentRole || null);
          setShowTimer(parsedState.showTimer || false);
          setTimerDuration(parsedState.timerDuration || 300);
          setCallDeadRoles(parsedState.callDeadRoles !== undefined ? parsedState.callDeadRoles : true);
          setMultipleExecutions(parsedState.multipleExecutions || false);
          setExecutionTargets(parsedState.executionTargets || []);
          setShowRemainingPlayers(parsedState.showRemainingPlayers || false);
        }
      } catch (error) {
        console.error('Error loading saved game state:', error);
      }
    }
  }, [gameConfig]);

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

      {showRemainingPlayers && renderRemainingPlayersModal()}

      {isGameOver() ? renderGameOver() : (
        <>
          {gamePhase === 'night' && renderNightPhase()}
          {gamePhase === 'morning' && renderMorningPhase()}
          {gamePhase === 'discussion' && renderDiscussionPhase()}
          {gamePhase === 'execution' && renderExecutionPhase()}
          {gamePhase === 'hunter_revenge' && renderHunterRevengePhase()}
        </>
      )}
    </div>
  );
};

export default GameManager;
