/**
 * This file defines the interface that all role components should implement.
 * It serves as documentation for the expected props and methods.
 * 
 * Note: JavaScript doesn't have formal interfaces, so this is for documentation purposes.
 */

/**
 * @typedef {Object} RoleProps
 * @property {Object} role - The role object with all its properties
 * @property {string} role.name - The name of the role
 * @property {string} role.team - The team the role belongs to (Village, Loups-Garous, Solitaire)
 * @property {string} role.description - Description of the role
 * @property {string} role.image_url - URL to the role's image
 * @property {boolean} role.wakes_up_at_night - Whether the role wakes up at night
 * @property {boolean} role.wakes_up_every_night - Whether the role wakes up every night
 * @property {string} role.wake_up_frequency - Frequency of waking up (first_night_only, 1/2, 1/3, etc.)
 * @property {Object} player - The player who has this role
 * @property {string} player.id - The player's ID
 * @property {string} player.name - The player's name
 * @property {Function} onActionComplete - Callback to call when the role's action is complete
 * @property {Function} onPrevRole - Callback to go to the previous role
 * @property {Array} alivePlayers - List of players who are still alive
 * @property {Function} getAlivePlayers - Function to get the current alive players
 * @property {number} currentNight - The current night number
 * @property {Object} gameState - The current game state
 * @property {Function} updateGameState - Function to update the game state
 */

/**
 * @typedef {Object} RoleDefinition
 * @property {string} name - The name of the role as it appears in the database
 * @property {string} team - The team the role belongs to
 * @property {boolean} wakesUpAtNight - Whether the role wakes up at night
 * @property {boolean} wakesUpEveryNight - Whether the role wakes up every night
 * @property {string} wakeUpFrequency - Frequency of waking up
 * @property {number} defaultOrder - Default order in the night phase
 * @property {Function} shouldWakeUp - Function to determine if the role should wake up on a given night
 * @property {Function} component - The React component to render for this role
 * @property {Function} initialize - Function to initialize role-specific state
 * @property {Function} handleNightEnd - Function to handle the end of the night phase
 */

// Export empty object as this is just for documentation
export default {};
