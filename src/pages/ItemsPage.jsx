import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useGameMode } from '../context/GameModeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { useFavorites } from '../context/FavoritesContext';
import CategoryFilterTree from '../components/CategoryFilterTree';
import FavoriteButton from '../components/FavoriteButton';
import SortDropdown from '../components/SortDropdown';
import '../styles/flea-market.css';

const PAGE_SIZE = 60;

export default function ItemsPage() {
  const { mode } = useGameMode();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { favoriteIds } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryId = searchParams.get('category') || null;
  const sort = searchParams.get('sort') || 'name_asc';
  const showFavoritesOnly = searchParams.get('fav') === '1';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const [queryInput, setQueryInput] = useState(searchParams.get('query') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('query') || '');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(queryInput);
      updateParams({ query: queryInput, page: '0' });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, language]);

  useEffect(() => {
    if (showFavoritesOnly) {
      loadFavoriteItems();
    } else {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, language, debouncedQuery, categoryId, sort, page, showFavoritesOnly, favoriteIds]);

  function updateParams(updates) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  }

  async function loadCategories() {
    try {
      const { data } = await axiosClient.get('/categories', { params: { mode, lang: language } });
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get('/items/search', {
        params: { mode, lang: language, query: debouncedQuery, categoryId: categoryId || undefined, sort, page, size: PAGE_SIZE },
      });
      setResults(data);
    } catch (err) {
      setError('No se pudo cargar los ítems');
    } finally {
      setLoading(false);
    }
  }

  async function loadFavoriteItems() {
    setLoading(true);
    setError('');
    try {
      const ids = Array.from(favoriteIds);
      if (ids.length === 0) {
        setResults({ content: [], totalPages: 0, totalElements: 0 });
        return;
      }
      const { data } = await axiosClient.get('/items/by-ids', {
        params: { mode, lang: language, ids: ids.join(',') },
      });
      setResults({ content: data, totalPages: 1, totalElements: data.length });
    } catch (err) {
      setError('No se pudieron cargar los favoritos');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectCategory(id) {
    updateParams({ fav: '', category: id, page: '0' });
  }

  function handleSelectFavorites() {
    updateParams({ fav: '1', category: '' });
  }

  return (
    <div className="market-page">
      <div className="market-title">
        <h2>{t('navItems')}</h2>
        <span className="mode-tag">{mode.toUpperCase()}</span>
      </div>

      <div className="market-body">
        <aside className="market-sidebar">
          <button
            className={`category-node category-node-all ${showFavoritesOnly ? 'active' : ''}`}
            onClick={handleSelectFavorites}
          >
            ★ {t('favorites')} <span className="category-count">{favoriteIds.size}</span>
          </button>

          <h3 className="market-sidebar-title">{t('categories')}</h3>
          <CategoryFilterTree
            categories={categories}
            selectedId={!showFavoritesOnly ? categoryId : undefined}
            onSelect={handleSelectCategory}
          />
        </aside>

        <div className="market-main">
          {!showFavoritesOnly && (
            <div className="market-controls">
              <input
                type="text"
                className="market-search"
                placeholder={t('searchPlaceholder')}
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
              />
              <SortDropdown value={sort} onChange={(v) => updateParams({ sort: v, page: '0' })} />
            </div>
          )}

          {error && <div className="hideout-error">{error}</div>}

          {loading ? (
            <p className="hideout-loading">{t('loading')}</p>
          ) : (
            <>
              <p className="market-count">
                {results.totalElements} {showFavoritesOnly ? t('favorites').toLowerCase() : t('results')}
              </p>

              {showFavoritesOnly && results.content.length === 0 && (
                <p className="summary-empty">{t('noFavoritesYet')}</p>
              )}

              <div className="market-grid">
                {results.content.map((item) => {
                  const isPositive = item.changeLast48h >= 0;
                  return (
                    <Link key={item.id} to={`/items/${item.id}`} className="market-card">
                      <FavoriteButton itemId={item.id} overlay />
                      {item.iconLink && <img src={item.iconLink} alt={item.name} className="market-icon" />}
                      <p className="market-name" title={item.name}>{item.name}</p>
                      <div className="market-price-block">
                        {item.canSellOnFlea ? (
                          <>
                            <div className="market-price-row">
                              <span className="market-price">₽{item.avg24hPrice.toLocaleString()}</span>
                              <span className={`market-change ${isPositive ? 'up' : 'down'}`}>
                                {isPositive ? '▲' : '▼'} {Math.abs(item.changeLast48h).toLocaleString()}
                                {' '}({item.changeLast48hPercent.toFixed(1)}%)
                              </span>
                            </div>
                            <p className="market-low">{t('minRecent')}: ₽{item.lastLowPrice.toLocaleString()}</p>
                          </>
                        ) : (
                          <p className="market-no-price">{t('noFleaPrice')}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {!showFavoritesOnly && results.totalPages > 1 && (
                <div className="market-pagination">
                  <button
                    className="level-btn"
                    disabled={page <= 0}
                    onClick={() => updateParams({ page: String(page - 1) })}
                  >
                    −
                  </button>
                  <span className="level-text">{t('page')} {page + 1} / {results.totalPages}</span>
                  <button
                    className="level-btn"
                    disabled={page >= results.totalPages - 1}
                    onClick={() => updateParams({ page: String(page + 1) })}
                  >
                    +
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}