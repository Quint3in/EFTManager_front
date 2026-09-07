import { useFavorites } from '../context/FavoritesContext';

export default function FavoriteButton({ itemId, overlay }) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.has(itemId);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(itemId);
  }

  return (
    <button
      className={`favorite-btn ${overlay ? 'favorite-btn-overlay' : ''} ${isFavorite ? 'active' : ''}`}
      onClick={handleClick}
      title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
}