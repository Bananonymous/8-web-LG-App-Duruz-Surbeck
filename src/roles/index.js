/**
 * Role Registry
 * 
 * This file serves as the central registry for all roles in the game.
 * It exports:
 * 1. A map of role names to their components
 * 2. Helper functions to work with roles
 * 3. Default role configurations
 */

// Import role components
// These will be implemented later
import BaseRole from './BaseRole';

// Role registry - will be populated as we implement roles
const roleRegistry = {};

/**
 * Register a role in the registry
 * @param {Object} roleDefinition - The role definition object
 */
export const registerRole = (roleDefinition) => {
  const { name } = roleDefinition;
  roleRegistry[name] = roleDefinition;
};

/**
 * Get a role by name
 * @param {string} name - The name of the role
 * @returns {Object|null} - The role definition or null if not found
 */
export const getRole = (name) => {
  return roleRegistry[name] || null;
};

/**
 * Get all registered roles
 * @returns {Object} - Map of role names to their definitions
 */
export const getAllRoles = () => {
  return { ...roleRegistry };
};

/**
 * Get roles by team
 * @param {string} team - The team name (Village, Loups-Garous, Solitaire)
 * @returns {Array} - Array of role definitions
 */
export const getRolesByTeam = (team) => {
  return Object.values(roleRegistry).filter(role => role.team === team);
};

/**
 * Check if a role should wake up on a given night
 * @param {Object} role - The role object from the database
 * @param {number} currentNight - The current night number
 * @returns {boolean} - Whether the role should wake up
 */
export const shouldRoleWakeUp = (role, currentNight) => {
  // If the role doesn't wake up at night, return false
  if (role.wakes_up_at_night !== true && role.wakes_up_at_night !== 1) {
    return false;
  }

  // If the role wakes up every night, return true
  if (role.wakes_up_every_night === true || role.wakes_up_every_night === 1) {
    return true;
  }

  // Special handling for Cupidon - only on first night
  if (role.name === 'Cupidon') {
    return currentNight === 1;
  }

  // Check wake up frequency
  if (role.wake_up_frequency) {
    if (role.wake_up_frequency === 'first_night_only' && currentNight === 1) {
      return true;
    }

    if (role.wake_up_frequency === '1/2' && currentNight % 2 === 1) {
      return true;
    }

    if (role.wake_up_frequency === '1/3' && currentNight % 3 === 1) {
      return true;
    }

    if (role.wake_up_frequency === '1/4' && currentNight % 4 === 1) {
      return true;
    }
  }

  return false;
};

/**
 * Get the component for a role
 * @param {string} roleName - The name of the role
 * @returns {Function} - The React component for the role
 */
export const getRoleComponent = (roleName) => {
  const role = getRole(roleName);
  return role?.component || BaseRole;
};

// Export the registry and helper functions
export default {
  registerRole,
  getRole,
  getAllRoles,
  getRolesByTeam,
  shouldRoleWakeUp,
  getRoleComponent
};
