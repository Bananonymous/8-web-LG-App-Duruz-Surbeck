# Role System for Werewolf Game

This directory contains the role system for the Werewolf game. It provides a modular and extensible way to implement different roles and their night actions.

## Directory Structure

```
src/roles/
  ├── index.js           # Role registry and exports
  ├── BaseRole.jsx       # Base role component with common interface
  ├── RoleInterface.js   # TypeScript-like interface definition
  ├── RoleFactory.jsx    # Factory for dynamically rendering role components
  ├── README.md          # This file
  ├── werewolf/          # Team-specific directories
  │   ├── Werewolf.jsx
  │   └── ...
  ├── village/
  │   ├── Voyante.jsx
  │   ├── Sorciere.jsx
  │   ├── Salvateur.jsx
  │   └── ...
  └── solitaire/
      └── ...
```

## How to Add a New Role

To add a new role with night actions, follow these steps:

1. **Create a new role component file** in the appropriate team directory (werewolf, village, or solitaire).
2. **Extend the BaseRole component** to inherit common UI elements and behavior.
3. **Register the role** using the `registerRole` function from the role registry.
4. **Add the role to the RoleFactory** to make it available for dynamic rendering.

### Example: Adding a New Role

Here's an example of how to create a new role:

```jsx
// src/roles/village/NewRole.jsx
import React, { useState } from 'react';
import BaseRole, { PlayerSelectionGrid } from '../BaseRole';
import { registerRole } from '../index';

const NewRole = ({
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
  // Role-specific state and logic
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Handle player selection
  const handlePlayerSelect = (playerId) => {
    setSelectedPlayer(playerId);
    // Update game state as needed
    updateGameState({ newRoleTarget: playerId });
  };
  
  return (
    <div className="mj-new-role-action">
      <h4>Choose a player for your night action:</h4>
      
      <PlayerSelectionGrid
        players={getAlivePlayers()}
        onSelect={handlePlayerSelect}
        selectedPlayerId={selectedPlayer}
        cupidonLovers={gameState.cupidonLovers || []}
      />
      
      <div className="mj-role-actions">
        <button
          className="mj-btn mj-btn-secondary"
          onClick={onPrevRole}
        >
          Previous
        </button>
        <button
          className="mj-btn"
          onClick={onActionComplete}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Register the new role
registerRole({
  name: 'NewRole',
  team: 'Village',
  wakesUpAtNight: true,
  wakesUpEveryNight: true,
  wakeUpFrequency: null,
  defaultOrder: 5,
  component: NewRole,
  shouldWakeUp: (role, currentNight) => true,
  initialize: (gameState) => ({
    ...gameState,
    newRoleTarget: null
  }),
  handleNightEnd: (gameState) => {
    // Process the role's night action
    return gameState;
  }
});

export default NewRole;
```

Then, update the RoleFactory to include your new role:

```jsx
// In src/roles/RoleFactory.jsx
const NewRole = lazy(() => import('./village/NewRole'));

// Add to the roleComponentMap
const roleComponentMap = {
  // ... existing roles
  'NewRole': NewRole,
};
```

## Role Interface

Each role component receives the following props:

- `role`: The role object with all its properties
- `player`: The player who has this role
- `onActionComplete`: Callback to call when the role's action is complete
- `onPrevRole`: Callback to go to the previous role
- `alivePlayers`: List of players who are still alive
- `getAlivePlayers`: Function to get the current alive players
- `currentNight`: The current night number
- `gameState`: The current game state
- `updateGameState`: Function to update the game state
- `isDead`: Whether the player with this role is dead

## Role Registration

When registering a role, you need to provide the following information:

- `name`: The name of the role as it appears in the database
- `team`: The team the role belongs to (Village, Loups-Garous, Solitaire)
- `wakesUpAtNight`: Whether the role wakes up at night
- `wakesUpEveryNight`: Whether the role wakes up every night
- `wakeUpFrequency`: Frequency of waking up (first_night_only, 1/2, 1/3, etc.)
- `defaultOrder`: Default order in the night phase
- `component`: The React component to render for this role
- `shouldWakeUp`: Function to determine if the role should wake up on a given night
- `initialize`: Function to initialize role-specific state
- `handleNightEnd`: Function to handle the end of the night phase

## Common UI Components

The BaseRole module exports several common UI components that you can use in your role components:

- `PlayerSelectionGrid`: A grid for selecting players
- `isPlayerInLove`: Helper function to check if a player is in love

These components help maintain a consistent UI across all roles.
