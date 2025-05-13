import { useState, useEffect, useRef } from 'react';
import './MJPage.css';
import './DiscussionPhase.css';
import './MorningPhase.css';
import './PlayerManagement.css';
import './NightPhase.css';
import './ExecutionPhase.css';
import './GameManager.css';
import '../styles/DesignSystem.css';
import RoleFactory from '../roles/RoleFactory';
import { shouldRoleWakeUp } from '../roles';
import Timer from './Timer';

const GameManager = ({ gameConfig, onRestart, setGameConfig }) => {
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

    // Ancien (Elder) states
    const [ancienHasUsedProtection, setAncienHasUsedProtection] = useState(false);
    const [ancienKilledByVillage, setAncienKilledByVillage] = useState(false);

    // Chevalier à l'épée rouillée (Knight with the Rusty Sword) states
    const [chevalierKilledByWerewolves, setChevalierKilledByWerewolves] = useState(false);
    const [werewolfToKillNextNight, setWerewolfToKillNextNight] = useState(null);

    // Infect père des loups (Infect Father of Wolves) states - BUGFIX: Initialize from localStorage
    // Clear localStorage on component mount to ensure a fresh start
    useEffect(() => {
        // Only clear if it's a new game (not a resumed game)
        const savedState = localStorage.getItem('werewolf_game_state');
        if (!savedState) {
            localStorage.removeItem('infectUsed');
        }
    }, []);

    const [infectUsed, setInfectUsed] = useState(false);
    // BUGFIX: Always initialize infectVictim as false to ensure it's not selected by default
    const [infectVictim, setInfectVictim] = useState(false);

    // Salvateur states
    const [salvateurProtectedPlayer, setSalvateurProtectedPlayer] = useState(null);
    const [salvateurLastProtectedPlayer, setSalvateurLastProtectedPlayer] = useState(null);

    // Track victims from the current night
    const [currentNightVictims, setCurrentNightVictims] = useState([]);

    // Player management state
    const [playerFilterTab, setPlayerFilterTab] = useState('all'); // 'all', 'alive', 'dead'

    // Load saved game state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('werewolf_game_state') ||
            sessionStorage.getItem('werewolf_game_state');

        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);

                // Only restore the game if it's the same game (based on gameId)
                if (parsedState.gameConfig && parsedState.gameConfig.gameId === gameConfig.gameId) {
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
                    setShowTimer(parsedState.showTimer || false);
                    setTimerDuration(parsedState.timerDuration || 300);
                    setCallDeadRoles(parsedState.callDeadRoles || false);
                    setMultipleExecutions(parsedState.multipleExecutions || false);
                    setExecutionTargets(parsedState.executionTargets || []);
                    setShowRemainingPlayers(parsedState.showRemainingPlayers || false);
                    setSalvateurProtectedPlayer(parsedState.salvateurProtectedPlayer || null);
                    setSalvateurLastProtectedPlayer(parsedState.salvateurLastProtectedPlayer || null);
                    setCurrentNightVictims(parsedState.currentNightVictims || []);
                    setPlayerFilterTab(parsedState.playerFilterTab || 'all');
                    setAncienHasUsedProtection(parsedState.ancienHasUsedProtection || false);
                    setAncienKilledByVillage(parsedState.ancienKilledByVillage || false);
                    setChevalierKilledByWerewolves(parsedState.chevalierKilledByWerewolves || false);
                    setWerewolfToKillNextNight(parsedState.werewolfToKillNextNight || null);

                    // CRITICAL FIX: Check both localStorage and parsedState for infectUsed
                    const infectUsedInLocalStorage = localStorage.getItem('infectUsed') === 'true';
                    setInfectUsed(infectUsedInLocalStorage || parsedState.infectUsed || false);

                    // If infection was used, make sure gameConfig reflects this
                    if (infectUsedInLocalStorage || parsedState.infectUsed) {
                        parsedState.gameConfig.infectUsed = true;
                    }

                    setInfectVictim(parsedState.infectVictim || false);

                    // BUGFIX: Check for infected players in localStorage
                    try {
                        const infectedPlayersStr = localStorage.getItem('infected_players');
                        if (infectedPlayersStr) {
                            const infectedPlayers = JSON.parse(infectedPlayersStr);

                            // Make sure gameConfig has the infectedPlayers array
                            if (!parsedState.gameConfig.infectedPlayers) {
                                parsedState.gameConfig.infectedPlayers = [];
                            }

                            // Add any infected players from localStorage that aren't already in the gameConfig
                            infectedPlayers.forEach(playerId => {
                                if (!parsedState.gameConfig.infectedPlayers.includes(playerId)) {
                                    parsedState.gameConfig.infectedPlayers.push(playerId);

                                    // Also update the player's name if needed
                                    const playerIndex = parsedState.gameConfig.players.findIndex(p => p.id === playerId);
                                    if (playerIndex !== -1 && !parsedState.gameConfig.players[playerIndex].name.includes('(Infecté)')) {
                                        parsedState.gameConfig.players[playerIndex].name += ' (Infecté)';
                                        parsedState.gameConfig.players[playerIndex].card.team = 'Loups-Garous';
                                    }
                                }
                            });

                            // Update the gameConfig with the merged infected players
                            setGameConfig(parsedState.gameConfig);
                        }
                    } catch (e) {
                        console.error('Error processing infected players from localStorage:', e);
                    }

                    console.log('Game state restored from localStorage');
                }
            } catch (error) {
                console.error('Error parsing saved game state:', error);
            }
        }
    }, [gameConfig]);

    // Timer for game duration
    useEffect(() => {
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

    // Create a ref to track if we've already initialized the night phase
    // This prevents the infinite loop we're seeing
    const hasInitializedNightPhase = useRef(false);

    // Initialize role queue for night phase
    useEffect(() => {
        if (gamePhase === 'night' && !hasInitializedNightPhase.current) {
            // Set the flag to true to prevent re-initialization
            hasInitializedNightPhase.current = true;

            const initNightPhase = async () => {
                try {
                    console.log("Initializing night phase for night", currentNight);

                    // Reset night victim selection when entering night phase
                    setNightVictim(null);

                    // BUGFIX: Reset infection state when entering night phase
                    setInfectVictim(false);
                    localStorage.removeItem('temp_infect_victim');

                    // Check if infection has been used in the current game - only once
                    const infectUsedInLocalStorage = localStorage.getItem('infectUsed') === 'true';

                    // Only update if the value is different to avoid re-renders
                    if (infectUsedInLocalStorage !== infectUsed) {
                        setInfectUsed(infectUsedInLocalStorage);
                    }

                    // Make sure gameConfig is consistent with our state - but only if needed
                    if (gameConfig && gameConfig.infectUsed !== infectUsedInLocalStorage) {
                        try {
                            // Create a shallow copy instead of deep copy to avoid unnecessary changes
                            const updatedGameConfig = { ...gameConfig };
                            updatedGameConfig.infectUsed = infectUsedInLocalStorage;

                            // Check if setGameConfig is defined before calling it
                            if (typeof setGameConfig === 'function') {
                                setGameConfig(updatedGameConfig);
                            } else {
                                // Update the original gameConfig directly as a fallback
                                gameConfig.infectUsed = infectUsedInLocalStorage;
                            }
                        } catch (error) {
                            console.error("Error updating gameConfig:", error);
                        }
                    }

                    // Check if there's a werewolf to kill from the Chevalier's ability
                    if (werewolfToKillNextNight) {
                        const werewolfPlayer = gameConfig.players.find(p => p.id === werewolfToKillNextNight);

                        if (werewolfPlayer && !victims.includes(werewolfToKillNextNight) && !executed.includes(werewolfToKillNextNight)) {
                            // Kill the werewolf
                            setVictims(prev => {
                                if (!prev.includes(werewolfToKillNextNight)) {
                                    // Show alert to inform the MJ
                                    alert(`⚠️ ATTENTION ⚠️\n\nL'épée rouillée du Chevalier a tué ${werewolfPlayer.name} (${werewolfPlayer.card.name}) cette nuit !`);

                                    // Check if the werewolf is a lover
                                    if (cupidonLovers.includes(werewolfToKillNextNight)) {
                                        // Find the other lover
                                        const otherLoverId = cupidonLovers.find(id => id !== werewolfToKillNextNight);
                                        if (otherLoverId && !prev.includes(otherLoverId) && !victims.includes(otherLoverId) && !executed.includes(otherLoverId)) {
                                            // Get the names for the alert
                                            const lover = gameConfig.players.find(p => p.id === otherLoverId)?.name;

                                            // Show alert to warn the MJ
                                            alert(`⚠️ ATTENTION ⚠️\n\n${werewolfPlayer.name} était amoureux avec ${lover}.\n\n${lover} meurt de chagrin !`);

                                            return [...prev, werewolfToKillNextNight, otherLoverId];
                                        }
                                    }

                                    return [...prev, werewolfToKillNextNight];
                                }
                                return prev;
                            });
                        }

                        // Reset the werewolf to kill
                        setWerewolfToKillNextNight(null);
                    }

                    // Get roles in the correct order based on admin panel configuration
                    console.log("Determining night roles...");
                    const roles = await determineNightRoles();
                    console.log("Night roles determined:", roles);

                    // Set the role queue with the ordered roles
                    setRoleQueue(roles);

                    if (roles.length > 0) {
                        console.log("Setting current role to:", roles[0]);
                        // Always start with the first role in the ordered list
                        setCurrentRole(roles[0]);
                    } else {
                        console.log("No roles to call, ending night phase");
                        // No roles to call, end the night
                        handleNightComplete();
                    }
                } catch (error) {
                    console.error('Error initializing night phase:', error);
                    // Fallback to a simple night phase without role calls
                    handleNightComplete();
                }
            };

            // Use setTimeout to ensure the night phase is properly initialized
            // This helps prevent the immediate completion of the night phase
            setTimeout(() => {
                initNightPhase();
            }, 100);
        }

        // Reset the initialization flag when we leave the night phase
        if (gamePhase !== 'night') {
            hasInitializedNightPhase.current = false;
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
        // Special handling for werewolf roles - group all werewolf roles together
        const roleGroups = {};

        allEligibleRoles.forEach(role => {
            // Make sure role object is valid
            if (!role || !role.card) return;

            // Check if this is a werewolf role (Loup-Garou or Infect père des loups)
            const isWerewolfRole = role.card.team === 'Loups-Garous' &&
                (role.card.name === 'Loup-Garou' || role.card.name === 'Infect père des loups');

            // Check if this is an infected player (they should wake up with the werewolves)
            const isInfected = (role.playerName && role.playerName.includes('(Infecté)')) ||
                (gameConfig.infectedPlayers && role.playerId &&
                    gameConfig.infectedPlayers.includes(role.playerId));

            if (isWerewolfRole) {
                // Group actual werewolf roles under 'Loup-Garou'
                const groupName = 'Loup-Garou';
                if (!roleGroups[groupName]) {
                    roleGroups[groupName] = [];
                }
                roleGroups[groupName].push(role);
            } else if (isInfected) {
                // Group infected players under their original role name
                const roleName = role.card.name;
                if (!roleGroups[roleName]) {
                    roleGroups[roleName] = [];
                }
                roleGroups[roleName].push(role);
            } else {
                // Normal grouping for non-werewolf roles
                const roleName = role.card.name;
                if (!roleGroups[roleName]) {
                    roleGroups[roleName] = [];
                }
                roleGroups[roleName].push(role);
            }
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

    // Process infection immediately - FINAL VERSION with direct approach
    const processInfection = () => {
        // Only proceed if we have a victim
        if (!nightVictim) {
            return;
        }

        // Get the victim player
        const victimPlayer = gameConfig.players.find(p => p.id === nightVictim);
        if (!victimPlayer) {
            console.error("Could not find victim player for infection");
            return;
        }

        // Store the victim ID before we clear it
        const victimId = nightVictim;

        // Mark infection as used IMMEDIATELY - no delay
        setInfectUsed(true);

        // Create a deep copy of the gameConfig to ensure all changes are properly tracked
        const updatedGameConfig = JSON.parse(JSON.stringify(gameConfig));

        // Mark infection as used in the gameConfig
        updatedGameConfig.infectUsed = true;

        // Change the victim's team to Loups-Garous
        const playerIndex = updatedGameConfig.players.findIndex(p => p.id === victimId);
        if (playerIndex !== -1) {
            // CRITICAL FIX: Modify the player's team directly - keep the original role name and description
            updatedGameConfig.players[playerIndex].card.team = 'Loups-Garous';

            // Add a note to the player's name to indicate they've been infected
            if (!updatedGameConfig.players[playerIndex].name.includes('(Infecté)')) {
                updatedGameConfig.players[playerIndex].name += ' (Infecté)';
            }

            // Make sure the infectedPlayers array exists
            if (!updatedGameConfig.infectedPlayers) {
                updatedGameConfig.infectedPlayers = [];
            }

            // Add the player to the infectedPlayers array if not already there
            if (!updatedGameConfig.infectedPlayers.includes(victimId)) {
                updatedGameConfig.infectedPlayers.push(victimId);
            }

            // Log infection for debugging (no alert)
            console.log(`${victimPlayer.name} a été infecté(e) et rejoint maintenant l'équipe des Loups-Garous tout en conservant son rôle d'origine !`);

            // CRITICAL FIX: Also directly update the original gameConfig.players array
            // This ensures the UI will reflect the changes immediately
            gameConfig.players[playerIndex].card.team = 'Loups-Garous';
            if (!gameConfig.players[playerIndex].name.includes('(Infecté)')) {
                gameConfig.players[playerIndex].name += ' (Infecté)';
            }

            // CRITICAL FIX: Ensure the infectedPlayers array exists in the original gameConfig
            if (!gameConfig.infectedPlayers) {
                gameConfig.infectedPlayers = [];
            }

            // CRITICAL FIX: Add the player to the infectedPlayers array in the original gameConfig
            if (!gameConfig.infectedPlayers.includes(victimId)) {
                gameConfig.infectedPlayers.push(victimId);
            }
        }

        // Update the gameConfig with all changes at once
        try {
            if (typeof setGameConfig === 'function') {
                setGameConfig(updatedGameConfig);
            } else {
                console.warn("setGameConfig is not defined in processInfection, skipping gameConfig update");
                // Update the original gameConfig directly as a fallback
                if (gameConfig) {
                    Object.assign(gameConfig, updatedGameConfig);
                }
            }
        } catch (error) {
            console.error("Error updating gameConfig in processInfection:", error);
        }

        // Save to localStorage to ensure it persists
        localStorage.setItem('infectUsed', 'true');

        // Also save the infected player ID to localStorage
        localStorage.setItem('infected_player_id', victimId.toString());

        // Save the list of all infected players
        try {
            const infectedPlayers = updatedGameConfig.infectedPlayers || [];
            localStorage.setItem('infected_players', JSON.stringify(infectedPlayers));
        } catch (e) {
            console.error('Failed to save infected players to localStorage', e);
        }

        console.log("Infection power has been used and is now marked as used");
        console.log("Updated player name:", updatedGameConfig.players.find(p => p.id === victimId)?.name);
        console.log("Updated player team:", updatedGameConfig.players.find(p => p.id === victimId)?.card.team);

        // Reset infection state for next night
        setInfectVictim(false);

        // Important: Set nightVictim to null so the player doesn't get killed
        setNightVictim(null);

        // CRITICAL: Directly modify the victims and currentNightVictims arrays
        // This is the most direct approach to ensure the player is not added to victims
        const newVictims = victims.filter(id => id !== victimId);
        setVictims(newVictims);

        const newCurrentNightVictims = currentNightVictims.filter(id => id !== victimId);
        setCurrentNightVictims(newCurrentNightVictims);

        // Set a global flag to prevent this player from being added to victims
        window.infectedPlayerId = victimId;
        localStorage.setItem('infected_player_id', victimId.toString());

        // Set a special flag in the gameConfig object
        if (!gameConfig.infectedPlayers) {
            gameConfig.infectedPlayers = [];
        }
        if (!gameConfig.infectedPlayers.includes(victimId)) {
            gameConfig.infectedPlayers.push(victimId);

            // BUGFIX: Save infected player ID to localStorage for backup
            try {
                localStorage.setItem('infected_player_id', victimId.toString());

                // Also save the list of all infected players
                localStorage.setItem('infected_players', JSON.stringify(gameConfig.infectedPlayers));
            } catch (e) {
                console.error('Failed to save infected player to localStorage', e);
            }
        }

        // Save game state to ensure changes are persisted
        saveGameState();

        // Force a re-render to ensure the UI is updated
        setTimeout(() => {
            // This will trigger a re-render
            setGamePhase(prev => prev);

            // Force a refresh of the player management modal if it's open
            if (showRemainingPlayers) {
                setShowRemainingPlayers(false);
                setTimeout(() => {
                    setShowRemainingPlayers(true);
                }, 50);
            }
        }, 100);
    };

    // Handle werewolf phase - FINAL VERSION
    const handleWerewolfPhase = () => {
        if (!nightVictim) {
            alert("Veuillez sélectionner une victime");
            return;
        }

        // Check if infection is selected
        if (infectVictim && !infectUsed) {
            console.log("INFECTION SELECTED - Processing infection");

            // Process infection - this will handle everything
            processInfection();

            // Log the state after infection
            console.log("After infection processing:");
            console.log("- nightVictim:", nightVictim);
            console.log("- victims:", victims);
            console.log("- currentNightVictims:", currentNightVictims);
            console.log("- infectVictim:", infectVictim);
            console.log("- infectUsed:", infectUsed);

            // Continue to next role
            handleNextRole();
            return;
        } else {
            console.log("Regular werewolf kill - no infection");
        }

        // Continue to next role
        handleNextRole();
    };

    // Handle next role in night phase
    const handleNextRole = () => {
        // Check if we're on the werewolf role and need to process infection
        if (currentRole?.card?.team === 'Loups-Garous') {
            // Simplified infection handling
            if (infectVictim && nightVictim && !infectUsed) {
                // Process the infection immediately
                processInfection();

                // Save the current game state after infection
                saveGameState();
            } else {
                // Make sure the night victim is saved
                try {
                    if (nightVictim) {
                        localStorage.setItem('temp_night_victim', nightVictim.toString());
                    }
                } catch (e) {
                    console.error('Failed to save night victim to localStorage', e);
                }
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
        console.log("Night phase complete - processing end of night");
        let newVictims = [...victims];

        // CRITICAL: Check for infected players in all possible ways

        // 1. Check localStorage
        const infectedPlayerId = localStorage.getItem('infected_player_id');
        if (infectedPlayerId) {
            // Clear the flag
            localStorage.removeItem('infected_player_id');

            // Make sure this player is not added to victims
            console.log(`Player ${infectedPlayerId} was infected (from localStorage), ensuring they are not added to victims`);

            // Remove from victims list if present
            newVictims = newVictims.filter(id => id !== parseInt(infectedPlayerId));
        }

        // 2. Check window global
        if (window.infectedPlayerId) {
            console.log(`Player ${window.infectedPlayerId} was infected (from window global), ensuring they are not added to victims`);

            // Remove from victims list if present
            newVictims = newVictims.filter(id => id !== window.infectedPlayerId);

            // Clear the flag
            window.infectedPlayerId = null;
        }

        // 3. Check gameConfig
        if (gameConfig.infectedPlayers && gameConfig.infectedPlayers.length > 0) {
            console.log(`Players ${gameConfig.infectedPlayers.join(', ')} were infected (from gameConfig), ensuring they are not added to victims`);

            // Remove all infected players from victims list
            newVictims = newVictims.filter(id => !gameConfig.infectedPlayers.includes(id));
        }

        // 4. Check for players with (Infecté) in their name
        const infectedPlayersByName = gameConfig.players
            .filter(p => p.name.includes('(Infecté)'))
            .map(p => p.id);

        if (infectedPlayersByName.length > 0) {
            console.log(`Players ${infectedPlayersByName.join(', ')} were infected (by name), ensuring they are not added to victims`);

            // Remove all infected players from victims list
            newVictims = newVictims.filter(id => !infectedPlayersByName.includes(id));
        }

        // Check if the werewolf victim was saved by the witch or protected by the Salvateur
        const savedByWitch = witchSaveUsed && nightVictim;
        const protectedBySalvateur = salvateurProtectedPlayer && nightVictim === salvateurProtectedPlayer;

        // Check if the werewolf victim is the Ancien and can use protection
        let ancienProtectionUsed = false;
        if (nightVictim) {
            const victimPlayer = gameConfig.players.find(p => p.id === nightVictim);
            const isAncien = victimPlayer?.card.name === 'Ancien';

            if (isAncien && !ancienHasUsedProtection && !savedByWitch && !protectedBySalvateur) {
                // Ancien uses protection to survive this attack
                ancienProtectionUsed = true;
                setAncienHasUsedProtection(true);

                // Show alert to inform the MJ
                alert(`⚠️ ATTENTION ⚠️\n\nL'Ancien (${victimPlayer.name}) a survécu à l'attaque grâce à sa protection spéciale. Il ne pourra plus utiliser cette protection.`);
            }
        }

        // The infection is now processed immediately when selected in the werewolf phase
        // via the processInfection function called in handleNextRole
        // So we only need to check if the victim is already infected here

        // Only add werewolf victim if not saved by witch, not protected by Salvateur, not protected by Ancien ability, and not infected
        if (nightVictim && !savedByWitch && !protectedBySalvateur && !ancienProtectionUsed && !infectVictim) {
            // Check if the player is already infected (should not be killed) - EMERGENCY FIX
            let victimPlayer = gameConfig.players.find(p => p.id === nightVictim);
            const isInfected = (
                // 0. CRITICAL: Check if infection was selected for this victim
                infectVictim ||

                // 1. Check player name
                (victimPlayer && victimPlayer.name.includes('(Infecté)')) ||

                // 2. Check localStorage
                localStorage.getItem('infected_player_id') === nightVictim.toString() ||
                localStorage.getItem('temp_infect_victim') === 'true' ||

                // 3. Check window global
                window.infectedPlayerId === nightVictim ||

                // 4. Check gameConfig
                (gameConfig.infectedPlayers && gameConfig.infectedPlayers.includes(nightVictim)) ||

                // 5. Check if the player's team is already Loups-Garous but they're not a werewolf
                (victimPlayer && victimPlayer.card.team === 'Loups-Garous' &&
                    victimPlayer.card.name !== 'Loup-Garou' &&
                    victimPlayer.card.name !== 'Infect père des loups')
            );

            // Double check if this player was infected
            console.log(`Checking if player ${nightVictim} is infected: ${isInfected}`);

            // Only add if not already in the list and not infected
            if (!isInfected && !newVictims.includes(nightVictim)) {
                console.log(`Adding player ${nightVictim} to victims list`);
                newVictims.push(nightVictim);
            } else {
                console.log(`NOT adding player ${nightVictim} to victims list - infected: ${isInfected}, already in list: ${newVictims.includes(nightVictim)}`);
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

            // Check if the victim is the Chevalier à l'épée rouillée
            // Use the same victimPlayer variable from above
            const isChevalier = victimPlayer?.card.name === 'Chevalier à l\'épée rouillée';

            if (isChevalier) {
                setChevalierKilledByWerewolves(true);

                // Find the first werewolf to the Chevalier's right
                const chevalierIndex = gameConfig.players.findIndex(p => p.id === nightVictim);

                // Find the first werewolf to the right (higher index, wrapping around if needed)
                let werewolfToKill = null;

                // First, check players with higher indices
                for (let i = chevalierIndex + 1; i < gameConfig.players.length; i++) {
                    const player = gameConfig.players[i];
                    if (player.card.team === 'Loups-Garous' && !newVictims.includes(player.id) && !victims.includes(player.id) && !executed.includes(player.id)) {
                        werewolfToKill = player;
                        break;
                    }
                }

                // If no werewolf found, wrap around to the beginning
                if (!werewolfToKill) {
                    for (let i = 0; i < chevalierIndex; i++) {
                        const player = gameConfig.players[i];
                        if (player.card.team === 'Loups-Garous' && !newVictims.includes(player.id) && !victims.includes(player.id) && !executed.includes(player.id)) {
                            werewolfToKill = player;
                            break;
                        }
                    }
                }

                // If a werewolf was found, mark it to be killed next night
                if (werewolfToKill) {
                    setWerewolfToKillNextNight(werewolfToKill.id);

                    // Show alert to inform the MJ
                    alert(`⚠️ ATTENTION ⚠️\n\nLe Chevalier à l'épée rouillée (${victimPlayer.name}) a été tué par les Loups-Garous. Son épée rouillée tuera ${werewolfToKill.name} (${werewolfToKill.card.name}) la nuit prochaine !`);
                } else {
                    // No werewolf found to kill
                    alert(`⚠️ ATTENTION ⚠️\n\nLe Chevalier à l'épée rouillée (${victimPlayer.name}) a été tué par les Loups-Garous, mais il n'y a pas de Loup-Garou vivant à sa droite à tuer.`);
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
            // COMPREHENSIVE CHECK for infected players - EMERGENCY FIX
            const victimPlayer = gameConfig.players.find(p => p.id === nightVictim);

            // Check all possible ways a player could be marked as infected
            const wasInfected = (
                // 0. CRITICAL: Check if infection was selected for this victim
                infectVictim ||

                // 1. Check player name
                (victimPlayer && victimPlayer.name.includes('(Infecté)')) ||

                // 2. Check localStorage
                localStorage.getItem('infected_player_id') === nightVictim.toString() ||
                localStorage.getItem('temp_infect_victim') === 'true' ||

                // 3. Check window global
                window.infectedPlayerId === nightVictim ||

                // 4. Check gameConfig
                (gameConfig.infectedPlayers && gameConfig.infectedPlayers.includes(nightVictim)) ||

                // 5. Check if the player's team is already Loups-Garous but they're not a werewolf
                (victimPlayer && victimPlayer.card.team === 'Loups-Garous' &&
                    victimPlayer.card.name !== 'Loup-Garou' &&
                    victimPlayer.card.name !== 'Infect père des loups')
            );

            // Double check if this player was infected
            console.log(`FINAL CHECK: Player ${nightVictim} infected status: ${wasInfected}`);

            // Only add to victims if not infected
            if (!wasInfected) {
                console.log(`Adding player ${nightVictim} to currentNightVictimsList`);
                currentNightVictimsList.push(nightVictim);
            } else {
                console.log(`NOT adding player ${nightVictim} to currentNightVictimsList - infected: ${wasInfected}`);
            }
        }

        // Add witch kill target if used
        if (witchKillTarget && !currentNightVictimsList.includes(witchKillTarget)) {
            currentNightVictimsList.push(witchKillTarget);
        }

        // Add lovers who died of heartbreak
        newVictims.forEach(victimId => {
            if (!victims.includes(victimId) && !currentNightVictimsList.includes(victimId)) {
                // Check if the player was infected instead of killed
                const victimPlayer = gameConfig.players.find(p => p.id === victimId);
                const wasInfected = victimPlayer && victimPlayer.name.includes('(Infecté)');

                // Only add to victims if not infected
                if (!wasInfected) {
                    currentNightVictimsList.push(victimId);
                }
            }
        });

        // Filter out any infected players from the victims list
        const filteredVictims = newVictims.filter(victimId => {
            const player = gameConfig.players.find(p => p.id === victimId);
            return !(player && player.name.includes('(Infecté)'));
        });

        // Update victims list and current night victims
        setVictims(filteredVictims);
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
        return gameConfig.players.filter(player => {
            // Check if player is in victims list
            const isInVictims = victims.includes(player.id);

            // If player is infected, they should be considered alive even if in victims list
            const isInfected = player.name.includes('(Infecté)');

            // Player is alive if not executed and either not in victims list or is infected
            return !executed.includes(player.id) && (!isInVictims || isInfected);
        });
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

        // Make sure the infectedPlayers array exists in gameConfig
        if (!gameConfig.infectedPlayers) {
            gameConfig.infectedPlayers = [];
        }

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
            currentNightVictims,
            playerFilterTab,
            ancienHasUsedProtection,
            ancienKilledByVillage,
            chevalierKilledByWerewolves,
            werewolfToKillNextNight,
            infectUsed,
            infectVictim
        };

        try {
            localStorage.setItem('werewolf_game_state', JSON.stringify(gameState));
            // Also save to sessionStorage as a backup
            sessionStorage.setItem('werewolf_game_state', JSON.stringify(gameState));

            // Also save infected players separately for redundancy
            if (gameConfig.infectedPlayers && gameConfig.infectedPlayers.length > 0) {
                localStorage.setItem('infected_players', JSON.stringify(gameConfig.infectedPlayers));
            }
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    };

    // Render night phase
    const renderNightPhase = () => (
        <div className="mj-phase mj-night-phase">
            <div className="mj-phase-header">
                <span className="mj-phase-indicator">Phase de Nuit {currentNight}</span>
                <div className="mj-night-actions">
                    <button
                        onClick={() => setShowWakeUpOrder(!showWakeUpOrder)}
                    >
                        {showWakeUpOrder ? 'Masquer l\'ordre' : 'Voir l\'ordre de réveil'}
                    </button>
                </div>
            </div>

            {showWakeUpOrder && roleQueue.length > 0 && (
                <div className="mj-wake-up-order">
                    <h3>Ordre de réveil complet :</h3>
                    <div className="mj-wake-up-list">
                        {roleQueue.map((role, index) => {
                            // For werewolf roles, show a combined display of all werewolf players
                            const isWerewolfRole = role.card.team === 'Loups-Garous' &&
                                (role.card.name === 'Loup-Garou' || role.card.name === 'Infect père des loups');

                            // Get all werewolf players if this is a werewolf role
                            const werewolfPlayers = isWerewolfRole ?
                                gameConfig.players.filter(p => {
                                    // Make sure player object is valid
                                    if (!p || !p.card) return false;

                                    // Check if player is infected (either by team or name)
                                    const isInfected = p.name ? p.name.includes('(Infecté)') : false;

                                    // Check if player is in the infectedPlayers array
                                    const isInInfectedArray = gameConfig.infectedPlayers &&
                                        p.id && gameConfig.infectedPlayers.includes(p.id);

                                    // Check if player's team is Loups-Garous
                                    const isWerewolfTeam = p.card.team === 'Loups-Garous';

                                    // Include all players on the werewolf team (including infected players)
                                    return (isWerewolfTeam || isInfected || isInInfectedArray) &&
                                        !victims.includes(p.id) &&
                                        !executed.includes(p.id);
                                }) : [];

                            return (
                                <div
                                    key={role.playerId}
                                    className={`mj-wake-up-item ${role === currentRole ? 'current' : ''} ${roleQueue.indexOf(role) < roleQueue.indexOf(currentRole) ? 'completed' : ''}`}
                                >
                                    <span className="mj-wake-up-number">{index + 1}</span>
                                    <span className="mj-wake-up-role-name">
                                        {isWerewolfRole ? 'Loups-Garous' : role.card.name}
                                    </span>
                                    <span className="mj-wake-up-player-name">
                                        {isWerewolfRole ?
                                            `(${werewolfPlayers.map(p => p.name).join(', ')})` :
                                            `(${role.playerName})`
                                        }
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {currentRole && (
                <div
                    className="mj-role-card"
                    data-game-state={JSON.stringify({
                        nightVictim,
                        infectVictim,
                        infectUsed
                    })}
                >
                    <div className="mj-role-header">
                        <div className="mj-role-position">
                            {roleQueue.indexOf(currentRole) + 1}/{roleQueue.length}
                        </div>
                        <h3>
                            {currentRole.card.team === 'Loups-Garous' &&
                                (currentRole.card.name === 'Loup-Garou' || currentRole.card.name === 'Infect père des loups') ?
                                'Loups-Garous' :
                                currentRole.card.name
                            } - {currentRole.playerName}
                        </h3>
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
                            ancienHasUsedProtection,
                            ancienKilledByVillage,
                            chevalierKilledByWerewolves,
                            werewolfToKillNextNight,
                            infectUsed,
                            infectVictim,
                            victims,
                            executed,
                            gameConfig
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
                            if (newState.ancienHasUsedProtection !== undefined) setAncienHasUsedProtection(newState.ancienHasUsedProtection);
                            if (newState.ancienKilledByVillage !== undefined) setAncienKilledByVillage(newState.ancienKilledByVillage);
                            if (newState.chevalierKilledByWerewolves !== undefined) setChevalierKilledByWerewolves(newState.chevalierKilledByWerewolves);
                            if (newState.werewolfToKillNextNight !== undefined) setWerewolfToKillNextNight(newState.werewolfToKillNextNight);

                            // BUGFIX: Special handling for infection state
                            if (newState.infectVictim !== undefined) {
                                setInfectVictim(newState.infectVictim);

                                // Save to localStorage for backup
                                localStorage.setItem('temp_infect_victim', newState.infectVictim.toString());

                                // If infection is selected, check if we need to process it immediately
                                if (newState.infectVictim && newState.nightVictim && !infectUsed) {
                                    console.log("Infection detected in updateGameState, will process soon");

                                    // We'll process the infection in handleNextRole
                                    // This ensures the UI has time to update before we process the infection
                                }
                            }

                            // Only update infectUsed if explicitly set and not already true
                            if (newState.infectUsed !== undefined && !infectUsed) {
                                setInfectUsed(newState.infectUsed);

                                // Save to localStorage for backup
                                if (newState.infectUsed) {
                                    localStorage.setItem('infectUsed', 'true');
                                }
                            }
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
                <span className="mj-phase-indicator">Aube du jour {currentNight}</span>
            </div>

            <div className="mj-morning-summary">
                <h3>Récapitulatif de la nuit</h3>

                {currentNightVictims.length > 0 ? (
                    <div className="mj-victims-list">
                        <h4>Victimes de la nuit :</h4>
                        <ul>
                            {currentNightVictims
                                .filter(victimId => {
                                    // Filter out infected players from the display
                                    const victim = gameConfig.players.find(p => p.id === victimId);
                                    return !(victim && victim.name.includes('(Infecté)'));
                                })
                                .map(victimId => {
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
                    <div className="mj-no-victims">Aucune victime cette nuit.</div>
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
                <span className="mj-phase-indicator">Discussion du jour {currentNight - 1}</span>
            </div>

            <div className="mj-discussion-controls">
                <div className="mj-timer-controls">
                    <h3>Minuteur de discussion</h3>
                    <div className="mj-timer-buttons">
                        <button
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
                        className="mj-btn-secondary"
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
                <span className="mj-phase-indicator">Vote du jour {currentNight - 1}</span>
            </div>

            <div className="mj-execution-controls">
                <div className="mj-execution-instructions">
                    <h3>Sélectionnez le(s) joueur(s) à exécuter</h3>
                    <p>Choisissez qui sera exécuté par le village suite au vote.</p>
                </div>

                <div className="mj-execution-toggle">
                    <input
                        type="checkbox"
                        id="multipleExecutions"
                        checked={multipleExecutions}
                        onChange={() => {
                            setMultipleExecutions(!multipleExecutions);
                        }}
                    />
                    <label htmlFor="multipleExecutions">
                        Exécutions multiples {multipleExecutions ? '(Activé)' : '(Désactivé)'}
                    </label>
                    <span className="mj-execution-toggle-label">
                        {multipleExecutions ? 'Plusieurs joueurs peuvent être exécutés' : 'Un seul joueur sera exécuté'}
                    </span>
                </div>

                <div className="mj-player-selection">
                    {getAlivePlayers().map(player => (
                        <div
                            key={player.id}
                            className={`mj-execution-player ${executionTargets.includes(player.id) ? 'selected' : ''}`}
                            onClick={() => {
                                if (multipleExecutions) {
                                    // Toggle selection for multiple executions
                                    setExecutionTargets(prev => {
                                        return prev.includes(player.id)
                                            ? prev.filter(id => id !== player.id)
                                            : [...prev, player.id];
                                    });
                                } else {
                                    // Single selection
                                    setExecutionTargets([player.id]);
                                }
                            }}
                        >
                            <div className="mj-execution-player-name">
                                {player.name}
                                {cupidonLovers.includes(player.id) && <span className="mj-lover-indicator"> ❤️</span>}
                            </div>
                            <div className="mj-execution-player-role">
                                {player.card.name}
                                <span className={`mj-execution-player-team ${player.card.team.toLowerCase()}`}>
                                    {player.card.team}
                                </span>
                            </div>
                            <div className="mj-execution-player-check">✓</div>
                        </div>
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
                                        const targetPlayer = gameConfig.players.find(p => p.id === targetId);
                                        const isHunter = targetPlayer?.card.name === 'Chasseur';
                                        if (isHunter) {
                                            setHunterCanShoot(true);
                                            alert("Le Chasseur a été exécuté et peut tirer sur un joueur avant de mourir.");
                                        }

                                        // Check if target is the Ancien
                                        const isAncien = targetPlayer?.card.name === 'Ancien';
                                        if (isAncien) {
                                            // If Ancien is killed by the village, all villagers lose their powers
                                            setAncienKilledByVillage(true);

                                            // Show alert to inform the MJ
                                            alert(`⚠️ ATTENTION ⚠️\n\nL'Ancien (${targetPlayer.name}) a été exécuté par le village. Tous les villageois perdent leurs pouvoirs spéciaux !`);
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
                        className="mj-btn-secondary"
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
                            onClick={() => {
                                setPlayerFilterTab('all'); // Reset to show all players
                                setShowRemainingPlayers(true);
                            }}
                        >
                            Gestion des joueurs
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

            {/* Player Management Modal */}
            {showRemainingPlayers && (
                <div className="mj-modal mj-player-management-modal">
                    <div className="mj-modal-content">
                        <div className="mj-modal-header">
                            <h3>Gestion des joueurs</h3>
                            <button
                                className="mj-modal-close"
                                onClick={() => setShowRemainingPlayers(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="mj-modal-body">
                            <div className="mj-player-status-tabs">
                                <button
                                    className={`mj-player-status-tab ${playerFilterTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setPlayerFilterTab('all')}
                                >
                                    Tous les joueurs
                                    <span className="mj-player-count">{gameConfig.players.length}</span>
                                </button>
                                <button
                                    className={`mj-player-status-tab ${playerFilterTab === 'alive' ? 'active' : ''}`}
                                    onClick={() => setPlayerFilterTab('alive')}
                                >
                                    Joueurs vivants
                                    <span className="mj-player-count">{getAlivePlayers().length}</span>
                                </button>
                                <button
                                    className={`mj-player-status-tab ${playerFilterTab === 'dead' ? 'active' : ''}`}
                                    onClick={() => setPlayerFilterTab('dead')}
                                >
                                    Joueurs morts
                                    <span className="mj-player-count">{gameConfig.players.length - getAlivePlayers().length}</span>
                                </button>
                            </div>

                            <div className="mj-players-grid">
                                {gameConfig.players
                                    .filter(player => {
                                        const isAlive = !victims.includes(player.id) && !executed.includes(player.id);
                                        if (playerFilterTab === 'all') return true;
                                        if (playerFilterTab === 'alive') return isAlive;
                                        if (playerFilterTab === 'dead') return !isAlive;
                                        return true;
                                    })
                                    .map(player => {
                                        const isAlive = !victims.includes(player.id) && !executed.includes(player.id);
                                        return (
                                            <div
                                                key={player.id}
                                                className={`mj-player-card ${isAlive ? 'alive' : 'dead'}`}
                                                onClick={() => {
                                                    // Toggle player status (alive/dead)
                                                    if (isAlive) {
                                                        // Kill player
                                                        if (confirm(`Êtes-vous sûr de vouloir tuer ${player.name} ?`)) {
                                                            setVictims(prev => [...prev, player.id]);
                                                        }
                                                    } else {
                                                        // Revive player
                                                        if (confirm(`Êtes-vous sûr de vouloir ressusciter ${player.name} ?`)) {
                                                            setVictims(prev => prev.filter(id => id !== player.id));
                                                            setExecuted(prev => prev.filter(id => id !== player.id));
                                                        }
                                                    }
                                                }}
                                            >
                                                <div className={`mj-player-status-indicator ${isAlive ? 'alive' : 'dead'}`}>
                                                    {isAlive ? '✓' : '✗'}
                                                </div>
                                                <div className="mj-player-name">
                                                    {player.name}
                                                    {cupidonLovers.includes(player.id) && <span className="mj-lover-indicator"> ❤️</span>}
                                                    {player.name.includes('(Infecté)') && <span style={{ marginLeft: '5px', color: '#dc3545' }}> 🧟</span>}
                                                </div>
                                                <div className="mj-player-role">
                                                    <div className="mj-player-role-name">
                                                        {player.card.name}
                                                        {player.name.includes('(Infecté)') &&
                                                            <span style={{
                                                                fontSize: '0.8em',
                                                                color: '#dc3545',
                                                                marginLeft: '5px',
                                                                fontStyle: 'italic'
                                                            }}>
                                                                (Infecté)
                                                            </span>
                                                        }
                                                    </div>
                                                    <div className={`mj-player-team ${player.name.includes('(Infecté)') || player.card.team === 'Loups-Garous' ? 'loups-garous' : player.card.team.toLowerCase()}`}>
                                                        {player.name.includes('(Infecté)') || player.card.team === 'Loups-Garous' ? 'Loups-Garous' : player.card.team}
                                                    </div>
                                                </div>
                                                <div className="mj-player-action-hint"></div>
                                            </div>
                                        );
                                    })}
                            </div>

                            <div className="mj-player-management-footer">
                                <div className="mj-player-management-stats">
                                    <div className="mj-player-stat">
                                        Vivants: <span className="mj-player-stat-value">{getAlivePlayers().length}</span>
                                    </div>
                                    <div className="mj-player-stat">
                                        Morts: <span className="mj-player-stat-value">{gameConfig.players.length - getAlivePlayers().length}</span>
                                    </div>
                                </div>
                                <div className="mj-player-management-actions">
                                    <button
                                        className="mj-btn-close"
                                        onClick={() => setShowRemainingPlayers(false)}
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameManager;
