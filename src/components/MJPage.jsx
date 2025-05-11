import { useState, useCallback } from 'react';
import GameSetup from './GameSetup';
import PlayerSetup from './PlayerSetup';
import GameManager from './GameManager';
import './MJPage.css';

const MJPage = () => {
  // Game state
  const [gameState, setGameState] = useState('setup'); // setup, playerSetup, inGame
  const [gameConfig, setGameConfig] = useState({
    variant: null, // null for base game, or variant id
    playerCount: 0,
    selectedCards: [],
    players: []
  });

  // Handle game setup completion
  const handleGameSetupComplete = (config) => {
    setGameConfig(prev => ({
      ...prev,
      variant: config.variant,
      playerCount: config.playerCount,
      selectedCards: config.selectedCards
    }));
    setGameState('playerSetup');
  };

  // Handle player setup completion
  const handlePlayerSetupComplete = (players) => {
    setGameConfig(prev => ({
      ...prev,
      players
    }));
    setGameState('inGame');
  };

  // Handle game restart
  const handleRestartGame = () => {
    setGameState('setup');
    setGameConfig({
      variant: null,
      playerCount: 0,
      selectedCards: [],
      players: []
    });

    // Clear saved game state
    localStorage.removeItem('werewolf_game_state');
    sessionStorage.removeItem('werewolf_game_state');
  };

  // Handle game config update (for state restoration)
  const handleGameConfigUpdate = useCallback((config) => {
    // Only update if the config is different to prevent infinite loops
    if (JSON.stringify(config) !== JSON.stringify(gameConfig)) {
      console.log('Updating game config from saved state');
      setGameConfig(config);
    }
  }, [gameConfig]);

  return (
    <div className="mj-container">
      <div className="mj-header">
        <h1>Maître du Jeu - Loups-Garous</h1>
        <p className="mj-subtitle">Gérez votre partie de Loups-Garous</p>
      </div>

      {gameState === 'setup' && (
        <GameSetup onComplete={handleGameSetupComplete} />
      )}

      {gameState === 'playerSetup' && (
        <PlayerSetup
          playerCount={gameConfig.playerCount}
          selectedCards={gameConfig.selectedCards}
          onComplete={handlePlayerSetupComplete}
          onBack={() => setGameState('setup')}
        />
      )}

      {gameState === 'inGame' && (
        <GameManager
          gameConfig={gameConfig}
          onRestart={handleRestartGame}
          onGameConfigUpdate={handleGameConfigUpdate}
        />
      )}
    </div>
  );
};

export default MJPage;
