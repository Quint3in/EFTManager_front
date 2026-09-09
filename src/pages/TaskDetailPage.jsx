import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate} from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useGameMode } from '../context/GameModeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { buildTradersLookup } from '../utils/hideoutTraders';
import { buildItemsLookup } from '../utils/hideoutItems';
import { buildMapsLookup } from '../utils/maps';
import { extractObjectiveItemIds, buildQuestItemsLookup } from '../utils/questItems';
import ObjectiveItemsPreview from '../components/ObjectiveItemsPreview';
import RequirementChip from '../components/RequirementChip';
import '../styles/item-detail.css';
import '../styles/task-detail.css';
import { useToast } from '../context/ToastContext';
import { addPendingUnlock, formatDelay } from '../utils/pendingUnlocks';

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const { mode } = useGameMode();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const [task, setTask] = useState(null);
  const [tradersLookup, setTradersLookup] = useState({});
  const [itemsLookup, setItemsLookup] = useState({});
  const [mapsLookup, setMapsLookup] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [objectiveItemsLookup, setObjectiveItemsLookup] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, taskId, language]);

  async function loadDetail() {
    setLoading(true);
    setError('');

    setTask(null);
    setTradersLookup({});
    setItemsLookup({});
    setMapsLookup({});
    setAchievements([]);
    setObjectiveItemsLookup({});

    try {
      const { data } = await axiosClient.get(`/tasks/${mode}/${taskId}`, { params: { lang: language } });
      setTask(data);

      try {
        const traderIds = new Set([
          data.traderId,
          ...data.traderStandingRewards.map((r) => r.traderId),
          ...data.traderRequirements.map((r) => r.traderId),
        ].filter(Boolean));
        if (traderIds.size > 0) {
          const { data: tradersData } = await axiosClient.get('/traders', {
            params: { mode, lang: language, ids: Array.from(traderIds).join(',') },
          });
          setTradersLookup(buildTradersLookup(tradersData));
        }
      } catch { /* no bloquea el resto */ }

      try {
        const rewardItemIds = [
          ...data.rewardItems.map((r) => r.itemId),
          ...data.startRewardItems.map((r) => r.itemId),
          ...data.failureRewardItems.map((r) => r.itemId),
          ...data.neededKeys.flatMap((nk) => nk.keyItemIds),
        ];
        if (rewardItemIds.length > 0) {
          const { data: itemsData } = await axiosClient.get('/items', {
            params: { mode, lang: language, ids: rewardItemIds.join(',') },
          });
          setItemsLookup(buildItemsLookup(itemsData));
        }
      } catch { /* no bloquea el resto */ }

      try {
        const objectiveItemIds = extractObjectiveItemIds(data.objectives);
        if (objectiveItemIds.length > 0) {
          const [itemsRes, questItemsRes] = await Promise.all([
            axiosClient.get('/items', { params: { mode, lang: language, ids: objectiveItemIds.join(',') } }),
            axiosClient.get(`/tasks/${mode}/quest-items`, { params: { lang: language, ids: objectiveItemIds.join(',') } }),
          ]);
          setObjectiveItemsLookup({
            ...buildItemsLookup(itemsRes.data),
            ...buildQuestItemsLookup(questItemsRes.data),
          });
        }
      } catch { /* no bloquea el resto */ }

      try {
        const mapIds = Array.from(new Set([
          data.mapId,
          ...data.objectives.flatMap((o) => o.mapIds || []),
          ...data.neededKeys.map((nk) => nk.mapId),
        ].filter(Boolean)));
        if (mapIds.length > 0) {
          const { data: mapsData } = await axiosClient.get('/maps', {
            params: { mode, lang: language, ids: mapIds.join(',') },
          });
          setMapsLookup(buildMapsLookup(mapsData));
        }
      } catch { /* no bloquea el resto: si /maps falla, seguimos sin mostrar el mapa, no toda la página */ }

      try {
        if (data.achievementRewardIds.length > 0) {
          const { data: achData } = await axiosClient.get(`/tasks/${mode}/achievements`, {
            params: { lang: language, ids: data.achievementRewardIds.join(',') },
          });
          setAchievements(achData);
        }
      } catch { /* no bloquea el resto */ }

    } catch (err) {
      setError(t('itemNotFound'));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleComplete() {
    setUpdating(true);
    try {
      const { data: upcomingUnlocks } = await axiosClient.put(
        `/tasks/${mode}/${taskId}/complete`,
        { completed: !task.completed },
        { params: { lang: language } }
      );

      const wasIncomplete = !task.completed;
      setTask((prev) => ({ ...prev, completed: !prev.completed }));

      if (wasIncomplete) {
        showToast(t('taskCompletedToast'), 'success');
        upcomingUnlocks.forEach((u) => {
          const delaySeconds = u.delaySecondsMax || u.delaySecondsMin;
          const unlockAt = Date.now() + delaySeconds * 1000;
          addPendingUnlock(u.taskId, u.taskName, mode, unlockAt);
          showToast(`${u.taskName} ${t('willUnlockIn')} ${formatDelay(delaySeconds)}`, 'info', 8000);
        });
      }
    } catch {
      setError(t('taskUpdateError'));
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <p className="hideout-loading">{t('loading')}</p>;
  if (error) return <div className="hideout-error">{error}</div>;
  if (!task) return <p className="hideout-loading">{t('itemNotFound')}</p>;

  const trader = tradersLookup[task.traderId];
  const taskMap = mapsLookup[task.mapId];

  return (
    <div className="task-detail-page">
      <button onClick={() => navigate(-1)} className="back-link back-link-btn">{t('backToTasks')}</button>

      <div className="task-detail-header">
        {task.taskImageLink && <img src={task.taskImageLink} alt={task.name} className="task-detail-image" />}

        <div className="task-detail-header-info">
          <div className="task-detail-title-row">
            <h2>{task.name}</h2>
            {task.kappaRequired && <span className="task-kappa">{t('requiredForKappa')}</span>}
          </div>
          <div className="task-detail-meta">
            {trader?.imageLink && <img src={trader.imageLink} alt="" className="task-trader-icon" />}
            <span>{trader ? trader.name : task.traderId}</span>
            <span className="task-level">{t('minLevel')} {task.minPlayerLevel}</span>
          </div>

          <div className="task-detail-flags">
            {task.factionName && task.factionName !== 'Any' && (
              <span className="task-flag">{task.factionName}</span>
            )}
            {task.restartable && <span className="task-flag">{t('restartable')}</span>}
            {task.lightkeeperRequired && <span className="task-flag lightkeeper">{t('lightkeeperRequired')}</span>}
            {task.mapId && (
              <span className="task-flag">{t('mapLabel')}: {taskMap ? taskMap.name : task.mapId}</span>
            )}
          </div>

          {task.traderRequirements.length > 0 && (
            <div className="req-chips task-detail-req-chips">
              {task.traderRequirements.map((req) => {
                const reqTrader = tradersLookup[req.traderId];
                return (
                  <RequirementChip
                    key={req.traderId}
                    type="trader"
                    imageLink={reqTrader?.imageLink}
                    label={reqTrader ? reqTrader.name : req.traderId}
                    level={req.level}
                  />
                );
              })}
            </div>
          )}

          {task.wikiLink && (
            <a href={task.wikiLink} target="_blank" rel="noopener noreferrer" className="task-wiki-link">
              {t('wikiLink')} ↗
            </a>
          )}
        </div>

        <button
          className={`task-detail-complete-btn ${task.completed ? 'completed' : ''}`}
          disabled={updating}
          onClick={handleToggleComplete}
        >
          {task.completed ? `✓ ${t('completed')}` : t('markCompleted')}
        </button>
      </div>

      <div className="item-detail-columns">
        <section className="item-detail-section">
          <h3>{t('objectives')}</h3>
          {task.objectives.length === 0 ? (
            <p className="summary-empty">—</p>
          ) : (
            <ul className="objectives-list">
              {task.objectives.map((obj) => (
                <li key={obj.id} className="objective-row">
                  <div className="objective-row-main">
                    <div>
                      <span className="objective-desc">
                        {obj.description}
                        {obj.optional && <span className="objective-optional"> ({t('optional')})</span>}
                      </span>
                      {obj.mapIds?.length > 0 && (
                        <p className="objective-maps">
                          {obj.mapIds.map((mid) => mapsLookup[mid]?.name || mid).join(', ')}
                        </p>
                      )}
                    </div>
                    {obj.itemIds?.length > 0 && (
                      <ObjectiveItemsPreview itemIds={obj.itemIds} lookup={objectiveItemsLookup} />
                    )}
                  </div>
                  {(obj.count || obj.foundInRaid || obj.dogTagLevel) && (
                    <div className="objective-badges">
                      {obj.count && <span className="objective-badge">×{obj.count}</span>}
                      {obj.foundInRaid && <span className="objective-badge fir">{t('firBadge')}</span>}
                      {obj.dogTagLevel != null && obj.dogTagLevel > 0 && (
                        <span className="objective-badge">{t('dogTagLevel')} ≥{obj.dogTagLevel}</span>
                      )}
                      {((obj.minDurability != null && obj.minDurability > 0) || (obj.maxDurability != null && obj.maxDurability < 100)) && (
                        <span className="objective-badge">
                          {t('durability')}: {obj.minDurability ?? 0}%–{obj.maxDurability ?? 100}%
                        </span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="item-detail-section">
          <h3>{t('rewards')}</h3>
          <p className="task-exp-reward">+{task.experience.toLocaleString()} EXP</p>

          {task.rewardItems.length === 0 ? (
            <p className="summary-empty">—</p>
          ) : (
            <ul>
              {task.rewardItems.map((r, i) => {
                const item = itemsLookup[r.itemId];
                return (
                  <li key={i} className="requirement-item">
                    {item?.iconLink && <img src={item.iconLink} alt="" className="requirement-icon" />}
                      <span>{item ? item.name : r.itemId} × {r.count}</span>
                      {item && (
                        <Link to={`/items/${r.itemId}`} className="view-item-link">
                          {t('viewItem')}
                        </Link>
                      )}
                  </li>
                );
              })}
            </ul>
          )}

          {task.traderStandingRewards.length > 0 && (
            <ul className="standing-rewards-list">
              {task.traderStandingRewards.map((r, i) => {
                const rTrader = tradersLookup[r.traderId];
                return (
                  <li key={i} className="standing-reward-row">
                    {rTrader?.imageLink && <img src={rTrader.imageLink} alt="" className="task-trader-icon" />}
                    <span>{rTrader ? rTrader.name : r.traderId}</span>
                    <span className="standing-value">+{r.standing.toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {achievements.length > 0 && (
            <div className="reward-subsection">
              <p className="reward-subsection-title">{t('achievementUnlocked')}</p>
              <ul>
                {achievements.map((a) => (
                  <li key={a.id} className="requirement-item">
                    {item?.iconLink && <img src={item.iconLink} alt="" className="requirement-icon" />}
                      <span>{item ? item.name : r.itemId} × {r.count}</span>
                      {item && (
                        <Link to={`/items/${r.itemId}`} className="view-item-link">
                          {t('viewItem')}
                        </Link>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {task.startRewardItems.length > 0 && (
            <div className="reward-subsection">
              <p className="reward-subsection-title">{t('startRewards')}</p>
              <ul>
                {task.startRewardItems.map((r, i) => {
                  const item = itemsLookup[r.itemId];
                  return (
                    <li key={i} className="requirement-item">
                      {item?.iconLink && <img src={item.iconLink} alt="" className="requirement-icon" />}
                        <span>{item ? item.name : r.itemId} × {r.count}</span>
                        {item && (
                          <Link to={`/items/${r.itemId}`} className="view-item-link">
                            {t('viewItem')}
                          </Link>
                        )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {task.failureRewardItems.length > 0 && (
            <div className="reward-subsection">
              <p className="reward-subsection-title">{t('failureOutcome')}</p>
              <ul>
                {task.failureRewardItems.map((r, i) => {
                  const item = itemsLookup[r.itemId];
                  return (
                    <li key={i} className="requirement-item">
                      {item?.iconLink && <img src={item.iconLink} alt="" className="requirement-icon" />}
                        <span>{item ? item.name : r.itemId} × {r.count}</span>
                        {item && (
                          <Link to={`/items/${r.itemId}`} className="view-item-link">
                            {t('viewItem')}
                          </Link>
                        )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {task.taskRequirements.length > 0 && (
          <section className="item-detail-section">
            <h3>{t('requiredTasks')}</h3>
            <ul className="task-requirements-list">
              {task.taskRequirements.map((req) => (
                <li key={req.taskId} className="task-req-row">
                  <Link to={`/tasks/${req.taskId}`} className="task-req-name">{req.taskName}</Link>
                  <span className={`task-req-status ${req.satisfied === true ? 'ok' : req.satisfied === false ? 'pending' : ''}`}>
                    {req.satisfied === true ? '✓' : req.satisfied === false ? '✗' : '?'} {req.status.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {task.neededKeys.length > 0 && (
          <section className="item-detail-section">
            <h3>{t('neededKeysTitle')}</h3>
            <ul className="needed-keys-list">
              {task.neededKeys.map((nk, i) => (
                <li key={i} className="needed-keys-row">
                  <p className="needed-keys-map">{mapsLookup[nk.mapId]?.name || nk.mapId}</p>
                  <div className="needed-keys-items">
                    {nk.keyItemIds.map((kid) => {
                      const key = itemsLookup[kid];
                      return (
                        <span key={kid} className="barter-required-item">
                          {key?.iconLink && <img src={key.iconLink} alt="" className="barter-item-icon" />}
                          {key ? key.name : kid}
                        </span>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}