import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useGameMode } from './GameModeContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { mode } = useGameMode();
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  async function loadFavorites() {
    try {
      const { data } = await axiosClient.get('/favorites', { params: { mode } });
      setFavoriteIds(new Set(data));
    } catch {
      setFavoriteIds(new Set());
    }
  }

  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const toggleFavorite = useCallback(async (itemId) => {
    const isFav = favoriteIds.has(itemId);

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(itemId) : next.add(itemId);
      return next;
    });

    try {
      if (isFav) {
        await axiosClient.delete(`/favorites/${itemId}`, { params: { mode } });
      } else {
        await axiosClient.post('/favorites', { itemId }, { params: { mode } });
      }
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFav ? next.add(itemId) : next.delete(itemId);
        return next;
      });
    }
  }, [favoriteIds, mode]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === null) {
    throw new Error('useFavorites debe usarse dentro de un <FavoritesProvider>');
  }
  return context;
}