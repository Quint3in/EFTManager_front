import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useGameMode } from '../context/GameModeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { buildTradersLookup } from '../utils/hideoutTraders';
import '../styles/compare.css';

export default function CompareTasksPage() {
  const { mode } = useGameMode();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [usernameInput, setUsernameInput] = useState(searchParams.get('username') || '');
  const [comparison, setComparison] = useState(null);
  const [tradersLookup, setTradersLookup] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentUsers, setRecentUsers] = useState(getRecentComparisons());

  

  useEffect(() => {
    if (searchParams.get('username')) {
      runComparison(searchParams.get('username'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, language]);

  async function runComparison(usernameToCompare) {
    setLoading(true);
    setError('');

    try {
      const { data } = await axiosClient.get(`/tasks/${mode}/compare`, {
        params: { username: usernameToCompare, lang: language },
      });
      setComparison(data);
      setRecentUsers(saveRecentComparison(usernameToCompare));

      const traderIds = data.byTrader.map((t) => t.traderId).filter(Boolean);
      if (traderIds.length > 0) {
        const { data: tradersData } = await axiosClient.get('/traders', {
          params: { mode, lang: language, ids: traderIds.join(',') },
        });
        setTradersLookup(buildTradersLookup(tradersData));
      }
    } catch (err) {
      setComparison(null);
      setError(err.response?.data?.message || t('compareError'));
    } finally {
      setLoading(false);
    }
  }

  function handleCompare(e) {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setSearchParams({ username: usernameInput }, { replace: true });
    runComparison(usernameInput);
  }
  
  const RECENT_KEY = 'recentComparisons';

  function getRecentComparisons() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveRecentComparison(username) {
    const current = getRecentComparisons().filter((u) => u.toLowerCase() !== username.toLowerCase());
    const updated = [username, ...current].slice(0, 4);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    return updated;
  }

  const selfPct = comparison && comparison.totalTasks > 0
    ? Math.round((comparison.selfCompleted / comparison.totalTasks) * 100) : 0;
  const otherPct = comparison && comparison.totalTasks > 0
    ? Math.round((comparison.otherCompleted / comparison.totalTasks) * 100) : 0;

  return (
    <div className="compare-page">
      <div className="tasks-title">
        <h2>{t('compareTitle')}</h2>
        <span className="mode-tag">{mode.toUpperCase()}</span>
      </div>

      <form className="compare-search-form" onSubmit={handleCompare}>
        <input
          type="text"
          className="market-search"
          placeholder={t('compareUsernamePlaceholder')}
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
        />
        {recentUsers.length > 0 && !comparison && (
          <div className="recent-comparisons">
            <span className="recent-comparisons-label">{t('recent')}:</span>
            {recentUsers.map((u) => (
              <button
                key={u}
                className="recent-comparison-chip"
                onClick={() => {
                  setUsernameInput(u);
                  setSearchParams({ username: u }, { replace: true });
                  runComparison(u);
                }}
              >
                {u}
              </button>
            ))}
          </div>
        )}
        <button type="submit" className="auth-submit compare-btn" disabled={loading}>
          {loading ? t('loading') : t('compareBtn')}
        </button>
      </form>

      {error && <div className="hideout-error">{error}</div>}

      {comparison && (
        <>
          <div className="compare-overview">
            <div className="compare-overview-row">
              <span className="compare-label self">{t('you')}</span>
              <div className="widget-progress-track">
                <div className="widget-progress-fill self" style={{ width: `${selfPct}%` }} />
              </div>
              <span className="compare-value">{comparison.selfCompleted}/{comparison.totalTasks} ({selfPct}%)</span>
            </div>
            <div className="compare-overview-row">
              <span className="compare-label other">{comparison.otherUsername}</span>
              <div className="widget-progress-track">
                <div className="widget-progress-fill other" style={{ width: `${otherPct}%` }} />
              </div>
              <span className="compare-value">{comparison.otherCompleted}/{comparison.totalTasks} ({otherPct}%)</span>
            </div>
          </div>

          <div className="compare-trader-grid">
            {comparison.byTrader.map((tc) => {
              const trader = tradersLookup[tc.traderId];
              const sPct = tc.total > 0 ? Math.round((tc.selfCompleted / tc.total) * 100) : 0;
              const oPct = tc.total > 0 ? Math.round((tc.otherCompleted / tc.total) * 100) : 0;
              return (
                <div key={tc.traderId} className="compare-trader-card">
                  <div className="compare-trader-header">
                    {trader?.imageLink && <img src={trader.imageLink} alt="" className="task-trader-icon" />}
                    <span>{trader ? trader.name : tc.traderId}</span>
                  </div>
                  <div className="compare-mini-track">
                    <span className="compare-mini-label self">{t('you')}</span>
                    <div className="widget-progress-track thin">
                      <div className="widget-progress-fill self" style={{ width: `${sPct}%` }} />
                    </div>
                    <span className="compare-mini-count">{tc.selfCompleted}/{tc.total}</span>
                  </div>
                  <div className="compare-mini-track">
                    <span className="compare-mini-label other">{comparison.otherUsername}</span>
                    <div className="widget-progress-track thin">
                      <div className="widget-progress-fill other" style={{ width: `${oPct}%` }} />
                    </div>
                    <span className="compare-mini-count">{tc.otherCompleted}/{tc.total}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="compare-diff-columns">
            <div className="compare-diff-col">
              <h3>{t('onlyYouCompleted')} ({comparison.onlySelfCompleted.length})</h3>
              {comparison.onlySelfCompleted.length === 0 ? (
                <p className="summary-empty">—</p>
              ) : (
                <ul className="compare-diff-list">
                  {comparison.onlySelfCompleted.map((item) => {
                    const trader = tradersLookup[item.traderId];
                    return (
                      <li key={item.taskId}>
                        <Link to={`/tasks/${item.taskId}`} className="compare-diff-link">
                          {trader?.imageLink && <img src={trader.imageLink} alt="" className="task-trader-icon" />}
                          <span>{item.taskName}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="compare-diff-col">
              <h3>{comparison.otherUsername} {t('onlyTheyCompleted')} ({comparison.onlyOtherCompleted.length})</h3>
              {comparison.onlyOtherCompleted.length === 0 ? (
                <p className="summary-empty">—</p>
              ) : (
                <ul className="compare-diff-list">
                  {comparison.onlyOtherCompleted.map((item) => {
                    const trader = tradersLookup[item.traderId];
                    return (
                      <li key={item.taskId}>
                        <Link to={`/tasks/${item.taskId}`} className="compare-diff-link">
                          {trader?.imageLink && <img src={trader.imageLink} alt="" className="task-trader-icon" />}
                          <span>{item.taskName}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}