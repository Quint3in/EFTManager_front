import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useGameMode } from '../context/GameModeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { buildTradersLookup } from '../utils/hideoutTraders';
import { buildMapsLookup } from '../utils/maps';
import TaskSortDropdown from '../components/TaskSortDropdown';
import '../styles/tasks.css';
import { useToast } from '../context/ToastContext';
import { addPendingUnlock, formatDelay } from '../utils/pendingUnlocks';

export default function TasksPage() {
  const { mode } = useGameMode();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [blockedMenuTaskId, setBlockedMenuTaskId] = useState(null);

  const traderFilter = searchParams.get('trader') || '';
  const mapFilter = searchParams.get('map') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || 'level_asc';
  const kappaOnly = searchParams.get('kappa') === '1';
  const lightkeeperOnly = searchParams.get('lightkeeper') === '1';

  const [queryInput, setQueryInput] = useState(searchParams.get('query') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('query') || '');
  const [tasks, setTasks] = useState([]);
  const [tradersLookup, setTradersLookup] = useState({});
  const [mapsLookup, setMapsLookup] = useState({});
  const [traderProgress, setTraderProgress] = useState({});
  const [kappaIconUrl, setKappaIconUrl] = useState(null);
  const [lightkeeperIconUrl, setLightkeeperIconUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(queryInput);
      updateParam('query', queryInput);
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  useEffect(() => {
    loadFilterOptions();
    loadFilterIcons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, language]);

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, language, debouncedQuery, traderFilter, mapFilter, statusFilter, sort, kappaOnly, lightkeeperOnly]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  async function loadFilterOptions() {
    try {
      const { data } = await axiosClient.get(`/tasks/${mode}`, { params: { lang: language, status: 'all' } });
      const traderIds = Array.from(new Set(data.map((task) => task.traderId).filter(Boolean)));
      const mapIds = Array.from(new Set(data.map((task) => task.mapId).filter(Boolean)));

      const [tradersRes, mapsRes] = await Promise.all([
        traderIds.length > 0
          ? axiosClient.get('/traders', { params: { mode, lang: language, ids: traderIds.join(',') } })
          : Promise.resolve({ data: [] }),
        mapIds.length > 0
          ? axiosClient.get('/maps', { params: { mode, lang: language, ids: mapIds.join(',') } })
          : Promise.resolve({ data: [] }),
      ]);

      setTradersLookup(buildTradersLookup(tradersRes.data));
      setMapsLookup(buildMapsLookup(mapsRes.data));

      const progress = {};
      data.forEach((task) => {
        if (!task.traderId) return;
        if (!progress[task.traderId]) progress[task.traderId] = { total: 0, completed: 0 };
        progress[task.traderId].total += 1;
        if (task.completed) progress[task.traderId].completed += 1;
      });
      setTraderProgress(progress);
    } catch {
      setTradersLookup({});
      setMapsLookup({});
      setTraderProgress({});
    }
  }

  async function loadFilterIcons() {
    try {
      const [itemsRes, tradersRes] = await Promise.all([
        axiosClient.get('/items', { params: { mode, lang: language, ids: '5c093ca986f7740a1867ab12' } }),
        axiosClient.get('/traders', { params: { mode, lang: language, ids: '638f541a29ffd1183d187f57' } }),
      ]);
      setKappaIconUrl(itemsRes.data[0]?.iconLink || null);
      setLightkeeperIconUrl(tradersRes.data[0]?.imageLink || null);
    } catch {
      setKappaIconUrl(null);
      setLightkeeperIconUrl(null);
    }
  }

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get(`/tasks/${mode}`, {
        params: {
          lang: language,
          query: debouncedQuery || undefined,
          traderId: traderFilter || undefined,
          mapId: mapFilter || undefined,
          status: statusFilter,
          kappaOnly: kappaOnly || undefined,
          lightkeeperOnly: lightkeeperOnly || undefined,
          sort,
        },
      });
      setTasks(data);
    } catch (err) {
      setError('No se pudieron cargar las misiones');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleComplete(taskId, currentlyCompleted) {
    setUpdatingId(taskId);
    try {
      const { data: upcomingUnlocks } = await axiosClient.put(
        `/tasks/${mode}/${taskId}/complete`,
        { completed: !currentlyCompleted },
        { params: { lang: language } }
      );

      const toggledTask = tasks.find((t) => t.id === taskId);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: !currentlyCompleted } : task)));

      if (toggledTask?.traderId) {
        setTraderProgress((prev) => {
          const current = prev[toggledTask.traderId] || { total: 0, completed: 0 };
          const delta = currentlyCompleted ? -1 : 1;
          return { ...prev, [toggledTask.traderId]: { ...current, completed: current.completed + delta } };
        });
      }

      if (!currentlyCompleted) {
        showToast(t('taskCompletedToast'), 'success');
        upcomingUnlocks.forEach((u) => {
          const delaySeconds = u.delaySecondsMax || u.delaySecondsMin;
          const unlockAt = Date.now() + delaySeconds * 1000;
          addPendingUnlock(u.taskId, u.taskName, mode, unlockAt);
          showToast(`${u.taskName} ${t('willUnlockIn')} ${formatDelay(delaySeconds)}`, 'info', 8000);
        });
      }
    } catch (err) {
      setError(t('taskUpdateError'));
    } finally {
      setUpdatingId(null);
    }
  }

  function handleSelectTrader(traderId) {
    updateParam('trader', traderFilter === traderId ? '' : traderId);
  }

  const traderOptions = Object.values(tradersLookup).sort((a, b) => a.name.localeCompare(b.name));
  const mapOptions = Object.values(mapsLookup).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="tasks-page">
      <div className="tasks-title">
        <h2>{t('tasksTitle')}</h2>
        <span className="mode-tag">{mode.toUpperCase()}</span>
        <Link to="/tasks/compare" className="compare-cta">
          <span className="compare-cta-icon">⇄</span>
          {t('compareWithFriend')}
        </Link>
      </div>

      <div className="tasks-body">
        <aside className="tasks-sidebar">
          <h3 className="tasks-sidebar-title">{t('tradersSectionTitle')}</h3>

          <button
            className={`trader-side-item ${traderFilter === '' ? 'active' : ''}`}
            onClick={() => updateParam('trader', '')}
          >
            <span className="trader-side-all-icon">✦</span>
            <span>{t('allTraders')}</span>
          </button>

          {traderOptions.map((trader) => {
            const prog = traderProgress[trader.id];
            const pct = prog && prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
            return (
              <button
                key={trader.id}
                className={`trader-side-item ${traderFilter === trader.id ? 'active' : ''}`}
                onClick={() => handleSelectTrader(trader.id)}
              >
                {trader.imageLink && <img src={trader.imageLink} alt="" className="trader-side-avatar" />}
                <div className="trader-side-info">
                  <span>{trader.name}</span>
                  {prog && (
                    <>
                      <div className="trader-side-track">
                        <div className="trader-side-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="trader-side-count">{prog.completed}/{prog.total}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        <div className="tasks-main">
          <div className="tasks-controls">
            <input
              type="text"
              className="market-search"
              placeholder={t('searchTaskPlaceholder')}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
            <select
              className="tasks-filter-select"
              value={mapFilter}
              onChange={(e) => updateParam('map', e.target.value)}
            >
              <option value="">{t('allMaps')}</option>
              {mapOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <select
              className="tasks-filter-select"
              value={statusFilter}
              onChange={(e) => updateParam('status', e.target.value === 'all' ? '' : e.target.value)}
            >
              <option value="all">{t('statusAll')}</option>
              <option value="incomplete">{t('statusIncomplete')}</option>
              <option value="completed">{t('statusCompleted')}</option>
            </select>
            <TaskSortDropdown value={sort} onChange={(v) => updateParam('sort', v)} />
            <button
              className={`kappa-toggle-icon ${kappaOnly ? 'active' : ''}`}
              onClick={() => updateParam('kappa', kappaOnly ? '' : '1')}
              title={t('kappaOnlyFilter')}
            >
              {kappaIconUrl ? <img src={kappaIconUrl} alt="Kappa" /> : 'K'}
            </button>
            <button
              className={`kappa-toggle-icon ${lightkeeperOnly ? 'active' : ''}`}
              onClick={() => updateParam('lightkeeper', lightkeeperOnly ? '' : '1')}
              title={t('lightkeeperOnlyFilter')}
            >
              {lightkeeperIconUrl ? <img src={lightkeeperIconUrl} alt="Lightkeeper" className="lightkeeper-avatar" /> : 'L'}
            </button>
          </div>

          {error && <div className="hideout-error">{error}</div>}

          {loading ? (
            <p className="hideout-loading">{t('loading')}</p>
          ) : tasks.length === 0 ? (
            <p className="summary-empty">{t('noTasksFound')}</p>
          ) : (
            <div className="tasks-grid">
              {tasks.map((task) => {
                const trader = tradersLookup[task.traderId];
                const taskMap = mapsLookup[task.mapId];
                return (
                  <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                    <Link to={`/tasks/${task.id}`} className="task-card-main">
                      {task.taskImageLink && <img src={task.taskImageLink} alt="" className="task-image" />}
                      <div className="task-info">
                        <p className="task-name">{task.name}</p>
                        <div className="task-meta">
                          {trader?.imageLink && <img src={trader.imageLink} alt="" className="task-trader-icon" />}
                          <span>{trader ? trader.name : task.traderId}</span>
                          <span className="task-level">Lv.{task.minPlayerLevel}</span>
                        </div>
                        {task.mapId && <p className="task-map-name">{taskMap ? taskMap.name : task.mapId}</p>}
                        {(task.kappaRequired || task.lightkeeperRequired) && (
                          <div className="task-badges-row">
                            {task.kappaRequired && <span className="task-kappa">KAPPA</span>}
                            {task.lightkeeperRequired && <span className="task-kappa lightkeeper">LIGHTKEEPER</span>}
                          </div>
                        )}
                        <p className="task-exp">{task.experience.toLocaleString()} EXP</p>
                      </div>
                      {task.unmetRequirements?.length > 0 && (
                        <div className="task-blocked-wrap">
                          <button
                            className="task-blocked-badge"
                            onClick={(e) => {
                              e.preventDefault();
                              setBlockedMenuTaskId(blockedMenuTaskId === task.id ? null : task.id);
                            }}
                          >
                            🔒
                          </button>
                          {blockedMenuTaskId === task.id && (
                            <div className="user-menu-dropdown task-blocked-menu">
                              <p className="task-blocked-menu-title">{t('requiresFirst')}</p>
                              {task.unmetRequirements.map((req) => (
                                <button
                                  key={req.taskId}
                                  className="user-menu-item"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigate(`/tasks/${req.taskId}`);
                                  }}
                                >
                                  {req.taskName}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                    <button
                      className={`task-complete-btn ${task.completed ? 'completed' : ''}`}
                      disabled={updatingId === task.id}
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      title={task.completed ? t('markIncomplete') : t('markCompleted')}
                    >
                      {task.completed ? '✓' : ''}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}