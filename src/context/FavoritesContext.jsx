import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useGameMode } from './GameModeContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { mode } = useGameMode();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const favoritesRequestRef = useRef(0);

  async function loadFavorites(requestId) {
    try {
      const { data } = await axiosClient.get('/favorites', { params: { mode } });
      if (requestId !== favoritesRequestRef.current) return;
      setFavoriteIds(new Set(data));
    } catch {
      if (requestId !== favoritesRequestRef.current) return;
      setFavoriteIds(new Set());
    }
  }

  useEffect(() => {
    const requestId = favoritesRequestRef.current + 1;
    favoritesRequestRef.current = requestId;
    setFavoriteIds(new Set());
    loadFavorites(requestId);
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