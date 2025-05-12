import React, { lazy, Suspense } from 'react';
import BaseRole from './BaseRole';
import { getRoleComponent } from './index';

// Import role components
// We'll use dynamic imports to avoid loading all roles at once
const Voyante = lazy(() => import('./village/Voyante'));
const Sorciere = lazy(() => import('./village/Sorciere'));
const Salvateur = lazy(() => import('./village/Salvateur'));
const Werewolf = lazy(() => import('./werewolf/Werewolf'));

// Map of role names to their components
const roleComponentMap = {
  'Voyante': Voyante,
  'Sorcière': Sorciere,
  'Salvateur': Salvateur,
  'Loup-Garou': Werewolf,
  // Add more roles here as they are implemented
};

/**
 * RoleFactory component
 * Dynamically renders the appropriate role component based on the role name
 */
const RoleFactory = (props) => {
  const { role } = props;

  // Get the appropriate component for this role
  const RoleComponent = roleComponentMap[role.name] || BaseRole;

  return (
    <Suspense fallback={<div>Chargement du rôle...</div>}>
      <RoleComponent {...props} />
    </Suspense>
  );
};

export default RoleFactory;
