import { createContext, useContext, useState } from 'react';

const GameModeContext = createContext(null);

const STORAGE_KEY = 'gameMode';

export function GameModeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'pvp';
  });

  const setMode = (newMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    setModeState(newMode);
  };

  return (
    <GameModeContext.Provider value={{ mode, setMode }}>
      {children}
    </GameModeContext.Provider>
  );
}

export function useGameMode() {
  return useContext(GameModeContext);
}