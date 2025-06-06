import { useState, useCallback, useEffect } from 'react';
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

  // Check for existing game in localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('werewolf_game_state') ||
      sessionStorage.getItem('werewolf_game_state');

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.gameConfig && parsedState.gameConfig.players && parsedState.gameConfig.players.length > 0) {
          setGameConfig(parsedState.gameConfig);
          setGameState('inGame');
        }
      } catch (error) {
        console.error('Error parsing saved game state:', error);
      }
    }
  }, []);

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
      setGameConfig(config);
    }
  }, [gameConfig]);

  // Check if there's a saved game
  const hasSavedGame = () => {
    return localStorage.getItem('werewolf_game_state') || sessionStorage.getItem('werewolf_game_state');
  };

  // Handle starting a new game (clearing saved state)
  const handleStartNewGame = () => {
    localStorage.removeItem('werewolf_game_state');
    sessionStorage.removeItem('werewolf_game_state');
    setGameState('setup');
    setGameConfig({
      variant: null,
      playerCount: 0,
      selectedCards: [],
      players: []
    });
  };

  return (
    <div className="mj-container">
      <div className="mj-header">
        <h1>Maître du Jeu - Loups-Garous</h1>
        <p className="mj-subtitle">Gérez votre partie de Loups-Garous</p>
      </div>

      {gameState === 'setup' && hasSavedGame() && (
        <div className="mj-saved-game-alert" style={{
          backgroundColor: 'var(--card-background)',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <h3>Partie en cours détectée</h3>
          <p>Une partie sauvegardée a été trouvée. Voulez-vous la reprendre ou commencer une nouvelle partie ?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              className="mj-btn"
              onClick={() => {
                const savedState = localStorage.getItem('werewolf_game_state') || sessionStorage.getItem('werewolf_game_state');
                if (savedState) {
                  const parsedState = JSON.parse(savedState);
                  setGameConfig(parsedState.gameConfig);
                  setGameState('inGame');
                }
              }}
            >
              Reprendre la partie
            </button>
            <button
              className="mj-btn mj-btn-secondary"
              onClick={handleStartNewGame}
            >
              Nouvelle partie
            </button>
          </div>
        </div>
      )}

      {gameState === 'setup' && !hasSavedGame() && (
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
          setGameConfig={setGameConfig}
        />
      )}
    </div>
  );
};

export default MJPage;
