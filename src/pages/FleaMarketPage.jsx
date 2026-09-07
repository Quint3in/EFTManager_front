import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useGameMode } from '../context/GameModeContext';
import { useLanguage } from '../context/LanguageContext';
import CategoryFilterTree from '../components/CategoryFilterTree';
import '../styles/flea-market.css';

const PAGE_SIZE = 60;

export default function FleaMarketPage() {
  const { mode } = useGameMode();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [results, setResults] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, language]);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, language, debouncedQuery, categoryId, page]);

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
        params: { mode, lang: language, query: debouncedQuery, categoryId: categoryId || undefined, page, size: PAGE_SIZE },
      });
      setResults(data);
    } catch (err) {
      setError('No se pudo cargar el mercado');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectCategory(id) {
    setCategoryId(id);
    setPage(0);
  }

  return (
    <div className="market-page">
      <div className="market-title">
        <h2>Mercado</h2>
        <span className="mode-tag">{mode.toUpperCase()}</span>
      </div>

      <div className="market-body">
        <aside className="market-sidebar">
          <h3 className="market-sidebar-title">Categorías</h3>
          <CategoryFilterTree
            categories={categories}
            selectedId={categoryId}
            onSelect={handleSelectCategory}
          />
        </aside>

        <div className="market-main">
          <input
            type="text"
            className="market-search"
            placeholder="Buscar ítem..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {error && <div className="hideout-error">{error}</div>}

          {loading ? (
            <p className="hideout-loading">Cargando ítems...</p>
          ) : (
            <>
              <p className="market-count">{results.totalElements} resultados</p>

              <div className="market-grid">
                {results.content.map((item) => {
                  const isPositive = item.changeLast48h >= 0;
                  return (
                    <Link key={item.id} to={`/market/${item.id}`} className="market-card">
                      {item.iconLink && (
                        <img src={item.iconLink} alt={item.name} className="market-icon" />
                      )}
                      <p className="market-name" title={item.name}>{item.name}</p>
                      {item.canSellOnFlea ? (
                        <>
                          <div className="market-price-row">
                            <span className="market-price">₽{item.avg24hPrice.toLocaleString()}</span>
                            <span className={`market-change ${isPositive ? 'up' : 'down'}`}>
                              {isPositive ? '▲' : '▼'} {Math.abs(item.changeLast48h).toLocaleString()}
                              {' '}({item.changeLast48hPercent.toFixed(1)}%)
                            </span>
                          </div>
                          <p className="market-low">Mín. reciente: ₽{item.lastLowPrice.toLocaleString()}</p>
                        </>
                      ) : (
                        <p className="market-no-price">No disponible en el mercado</p>
                      )}
                    </Link>
                  );
                })}
              </div>

              {results.totalPages > 1 && (
                <div className="market-pagination">
                  <button className="level-btn" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>−</button>
                  <span className="level-text">Página {page + 1} de {results.totalPages}</span>
                  <button
                    className="level-btn"
                    disabled={page >= results.totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
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