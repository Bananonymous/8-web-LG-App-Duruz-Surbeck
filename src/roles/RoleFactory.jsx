import React, { lazy, Suspense } from 'react';
import BaseRole from './BaseRole';
import { getRoleComponent } from './index';

// Import role components
// We'll use dynamic imports to avoid loading all roles at once
const Voyante = lazy(() => import('./village/Voyante'));
const Sorciere = lazy(() => import('./village/Sorciere'));
const Salvateur = lazy(() => import('./village/Salvateur'));
const Ancien = lazy(() => import('./village/Ancien'));
const Chevalier = lazy(() => import('./village/Chevalier'));
const Comedien = lazy(() => import('./village/Comedien'));
const Werewolf = lazy(() => import('./werewolf/Werewolf'));

// Map of role names to their components
const roleComponentMap = {
  'Voyante': Voyante,
  'Sorcière': Sorciere,
  'Salvateur': Salvateur,
  'Ancien': Ancien,
  'Chevalier à l\'épée rouillée': Chevalier,
  'Comédien': Comedien,
  'Loup-Garou': Werewolf,
  'Infect père des loups': Werewolf, // Use the same component as regular werewolves
  // Add more roles here as they are implemented
};

// Helper function to check if a player is infected
const isPlayerInfected = (player) => {
  if (!player) return false;

  // Check name for (Infecté) marker
  if (typeof player === 'string') {
    return player.includes('(Infecté)');
  }

  // Check player name
  if (player.name) {
    return player.name.includes('(Infecté)');
  }

  // Check playerName
  if (player.playerName) {
    return player.playerName.includes('(Infecté)');
  }

  return false;
};

/**
 * RoleFactory component
 * Dynamically renders the appropriate role component based on the role name
 */
const RoleFactory = (props) => {
  const { role, player } = props;

  // Check if this player is infected
  const infected = isPlayerInfected(player) ||
    isPlayerInfected(props.playerName) ||
    (role && isPlayerInfected(role));

  // Handle the case where role is directly a card object (happens with Infect père des loups)
  if (role && !role.card && role.name === 'Infect père des loups') {
    // Create a proper role object without logging
    const fixedProps = {
      ...props,
      role: {
        card: role,
        playerId: props.playerId || 0,
        playerName: props.playerName || 'Infect père des loups'
      }
    };

    return (
      <Suspense fallback={<div>Chargement du rôle...</div>}>
        <Werewolf {...fixedProps} />
      </Suspense>
    );
  }

  // Handle the case where role is an object with id, name, team, etc. but no card property
  if (role && !role.card && role.id && role.name && role.team === 'Loups-Garous' && !infected) {
    // Create a proper role object without logging
    const fixedProps = {
      ...props,
      role: {
        card: {
          id: role.id,
          name: role.name,
          team: role.team,
          description: role.description || '',
          lore: role.lore || ''
        },
        playerId: props.playerId || 0,
        playerName: props.playerName || role.name
      }
    };

    return (
      <Suspense fallback={<div>Chargement du rôle...</div>}>
        <Werewolf {...fixedProps} />
      </Suspense>
    );
  }

  // Safety check - if role is invalid, try to fix it or use BaseRole
  if (!role || !role.card || !role.card.name) {
    console.error('Invalid role object passed to RoleFactory:', role);

    // Last attempt to fix the role object if it has a name property
    if (role && role.name) {
      console.log("Attempting to fix invalid role object with name:", role.name);

      // Create a fixed role object with the available properties
      const fixedProps = {
        ...props,
        role: {
          card: {
            id: role.id || 0,
            name: role.name,
            team: role.team || 'Village',
            description: role.description || '',
            lore: role.lore || ''
          },
          playerId: props.playerId || 0,
          playerName: props.playerName || role.name
        }
      };

      // If it's an actual werewolf role (not just infected), use the Werewolf component
      if (!infected && ((role.team === 'Loups-Garous' && (role.name === 'Loup-Garou' || role.name === 'Infect père des loups')) ||
        role.name === 'Infect père des loups' ||
        role.name === 'Loup-Garou')) {
        return (
          <Suspense fallback={<div>Chargement du rôle...</div>}>
            <Werewolf {...fixedProps} />
          </Suspense>
        );
      }

      // If it's an infected player, we need to use their original role component
      if (infected) {
        // Extract the original role name from the player name if possible
        let originalRoleName = role.name;

        // For infected players, try to find the appropriate component based on their original role
        const RoleComponent = roleComponentMap[originalRoleName] || BaseRole;
        return (
          <Suspense fallback={<div>Chargement du rôle...</div>}>
            <RoleComponent {...fixedProps} />
          </Suspense>
        );
      }

      // For other roles, try to find the appropriate component
      const RoleComponent = roleComponentMap[role.name] || BaseRole;
      return (
        <Suspense fallback={<div>Chargement du rôle...</div>}>
          <RoleComponent {...fixedProps} />
        </Suspense>
      );
    }

    // If all else fails, use BaseRole
    return (
      <Suspense fallback={<div>Chargement du rôle...</div>}>
        <BaseRole {...props} />
      </Suspense>
    );
  }

  // Get the appropriate component for this role
  let RoleComponent;

  // Special handling for werewolf roles vs infected players
  if (infected) {
    // CRITICAL FIX: For infected players, ALWAYS use the component mapped to their original role name
    // This ensures infected players keep their original role interface
    console.log("Using original role component for infected player:", role.card.name);
    RoleComponent = roleComponentMap[role.card.name] || BaseRole;
  } else if ((role.card.team === 'Loups-Garous' && (role.card.name === 'Loup-Garou' || role.card.name === 'Infect père des loups')) ||
    role.card.name === 'Infect père des loups') {
    // Only actual werewolf roles use the Werewolf component
    RoleComponent = Werewolf;
  } else {
    // For all other roles, use the component mapped to their original role name
    RoleComponent = roleComponentMap[role.card.name] || BaseRole;
  }

  return (
    <Suspense fallback={<div>Chargement du rôle...</div>}>
      <RoleComponent {...props} />
    </Suspense>
  );
};

export default RoleFactory;
