import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useGameMode } from '../context/GameModeContext';
import { extractItemIds, buildItemsLookup, formatDuration } from '../utils/hideoutItems';
import { extractTraderIds, buildTradersLookup } from '../utils/hideoutTraders';
import { extractSkillIds, buildSkillsLookup, formatSkillCode } from '../utils/hideoutSkills';
import HideoutSummary from '../components/HideoutSummary';
import RequirementChip from '../components/RequirementChip';
import '../styles/hideout.css';


export default function HideoutPage() {
  const { mode } = useGameMode();
  const [stations, setStations] = useState([]);
  const [itemsLookup, setItemsLookup] = useState({});
  const [tradersLookup, setTradersLookup] = useState({});
  const [skillsLookup, setSkillsLookup] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [layout, setLayoutState] = useState(() => localStorage.getItem('hideoutLayout') || 'side');

  function setLayout(newLayout) {
  localStorage.setItem('hideoutLayout', newLayout);
  setLayoutState(newLayout);
}

function SideLayoutIcon() {
  return (
    <svg viewBox="0 0 20 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="12" height="14" />
      <rect x="15" y="1" width="4" height="14" />
    </svg>
  );
}

function StackedLayoutIcon() {
  return (
    <svg viewBox="0 0 20 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="18" height="9" />
      <rect x="1" y="12" width="18" height="3" />
    </svg>
  );
}
function SummaryTopLayoutIcon() {
  return (
    <svg viewBox="0 0 20 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="18" height="3" />
      <rect x="1" y="6" width="18" height="9" />
    </svg>
  );
}

  useEffect(() => {
    loadHideout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Comprueba qué ids de items/traders NO están ya resueltos en los lookups dados,
  // y solo pide esos a la API. Devuelve los nuevos lookups parciales (pueden venir vacíos).
  async function resolveMissingLookups(stationsToCheck, knownItemsLookup, knownTradersLookup, knownSkillsLookup) {
    const allItemIds = extractItemIds(stationsToCheck);
    const allTraderIds = extractTraderIds(stationsToCheck);
    const allSkillIds = extractSkillIds(stationsToCheck);

    const missingItemIds = allItemIds.filter((id) => !(id in knownItemsLookup));
    const missingTraderIds = allTraderIds.filter((id) => !(id in knownTradersLookup));
    const missingSkillIds = allSkillIds.filter((id) => !(id in knownSkillsLookup));

    if (missingItemIds.length === 0 && missingTraderIds.length === 0 && missingSkillIds.length === 0) {
      return { items: {}, traders: {}, skills: {} };
    }

    const [itemsResult, tradersResult, skillsResult] = await Promise.all([
      missingItemIds.length > 0
        ? axiosClient.get('/items', { params: { mode, ids: missingItemIds.join(',') } })
        : Promise.resolve({ data: [] }),
      missingTraderIds.length > 0
        ? axiosClient.get('/traders', { params: { mode, ids: missingTraderIds.join(',') } })
        : Promise.resolve({ data: [] }),
      missingSkillIds.length > 0
        ? axiosClient.get('/skills', { params: { mode, ids: missingSkillIds.join(',') } })
        : Promise.resolve({ data: [] }),
    ]);

    return {
      items: buildItemsLookup(itemsResult.data),
      traders: buildTradersLookup(tradersResult.data),
      skills: buildSkillsLookup(skillsResult.data),
    };
  }

  async function loadHideout() {
    setLoading(true);
    setError('');
    try {
      const { data: stationsData } = await axiosClient.get(`/hideout/${mode}`);
      setStations(stationsData);

      const { items, traders, skills } = await resolveMissingLookups(stationsData, {}, {}, {});
      setItemsLookup(items);
      setTradersLookup(traders);
      setSkillsLookup(skills);
    } catch (err) {
      setError('No se pudo cargar el hideout');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetLevel(stationId, newLevel) {
    setUpdatingId(stationId);
    setError('');
    try {
      const { data: updatedStation } = await axiosClient.put(
        `/hideout/${mode}/${stationId}`,
        { level: newLevel }
      );

      const updatedStations = stations.map((s) => (s.id === stationId ? updatedStation : s));

      // Resolvemos primero lo que falte, ANTES de tocar "stations",
      // así el componente no llega a pintar IDs crudos en ningún momento.
      const { items, traders, skills } = await resolveMissingLookups(updatedStations, itemsLookup, tradersLookup, skillsLookup);

      if (Object.keys(items).length > 0) {
        setItemsLookup((prev) => ({ ...prev, ...items }));
      }
      if (Object.keys(traders).length > 0) {
        setTradersLookup((prev) => ({ ...prev, ...traders }));
      }
      if (Object.keys(skills).length > 0) {
        setSkillsLookup((prev) => ({ ...prev, ...skills }));
      }

      setStations(updatedStations);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el nivel');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p className="hideout-loading">Cargando estaciones del hideout...</p>;
  }

  return (
    <div className="hideout-page">
      <div className="hideout-title">
        <h2>Hideout</h2>
        <span className="mode-tag">{mode.toUpperCase()}</span>

        <div className="mode-switch layout-switch">
          <button
            className={`mode-btn icon-btn ${layout === 'side' ? 'selected' : ''}`}
            onClick={() => setLayout('side')}
            title="Vista lateral"
            aria-label="Vista lateral"
          >
            <SideLayoutIcon />
          </button>
          <button
            className={`mode-btn icon-btn ${layout === 'stacked' ? 'selected' : ''}`}
            onClick={() => setLayout('stacked')}
            title="Vista apilada"
            aria-label="Vista apilada"
          >
            <StackedLayoutIcon />
          </button>
            <button
              className={`mode-btn icon-btn ${layout === 'summary-top' ? 'selected' : ''}`}
              onClick={() => setLayout('summary-top')}
              title="Resumen arriba"
              aria-label="Resumen arriba"
            >
            <SummaryTopLayoutIcon />
          </button>
        </div>
      </div>
      {error && <div className="hideout-error">{error}</div>}

      <div className={`hideout-layout ${layout}`}>
        <div className="hideout-grid">
          {stations.map((station) => (
            <div
              key={station.id}
              className={`station-card ${updatingId === station.id ? 'is-updating' : ''}`}
            >
              <div className="station-header">
                {station.imageLink && (
                  <img src={station.imageLink} alt={station.name} className="station-image" />
                )}
                <div className="station-title-block">
                  <h3 title={station.name}>{station.name}</h3>
                  <div className="level-stepper">
                    <button
                      className="level-btn"
                      disabled={updatingId === station.id || station.currentLevel <= station.minLevel}
                      onClick={() => handleSetLevel(station.id, station.currentLevel - 1)}
                    >
                      −
                    </button>
                    <div className="pip-track">
                      {Array.from({ length: station.maxLevel }).map((_, i) => (
                        <span key={i} className={`pip ${i < station.currentLevel ? 'filled' : ''}`} />
                      ))}
                    </div>
                    <button
                      className="level-btn"
                      disabled={updatingId === station.id || station.currentLevel >= station.maxLevel}
                      onClick={() => handleSetLevel(station.id, station.currentLevel + 1)}
                    >
                      +
                    </button>
                    <span className="level-text">{station.currentLevel}/{station.maxLevel}</span>
                  </div>
                </div>
              </div>

              {station.remainingRequirements.length === 0 ? (
                <p className="station-maxed">Estación al máximo</p>
              ) : (
                <div className="station-requirements">
                  {station.remainingRequirements.map((levelReq) => {
                    const isTimeOnly = levelReq.itemRequirements.length === 0;
                    const hasExtraReqs =
                      levelReq.traderRequirements.length > 0 ||
                      levelReq.stationRequirements.length > 0 ||
                      levelReq.skillRequirements.length > 0;

                    return (
                      <div key={levelReq.level} className="level-block">
                        <p className="level-title">Nivel {levelReq.level}</p>
                        <div className="level-body">
                          {hasExtraReqs && (
                            <div className="req-chips">
                              {levelReq.traderRequirements.map((t) => {
                                const trader = tradersLookup[t.traderId];
                                return (
                                  <RequirementChip
                                    key={t.traderId}
                                    type="trader"
                                    imageLink={trader?.imageLink}
                                    label={trader ? trader.name : t.traderId}
                                    level={t.level}
                                  />
                                );
                              })}
                              {levelReq.stationRequirements.map((s) => (
                                <RequirementChip
                                  key={s.stationId}
                                  type="station"
                                  imageLink={s.imageLink}
                                  label={s.stationName}
                                  level={s.level}
                                />
                              ))}
                              {levelReq.skillRequirements.map((s) => {
                                const skill = skillsLookup[s.skill];
                                return (
                                  <RequirementChip
                                    key={s.skill}
                                    type="skill"
                                    imageLink={skill?.imageLink}
                                    label={skill ? skill.name : formatSkillCode(s.skill)}
                                    level={s.level}
                                  />
                                );
                              })}
                            </div>
                          )}

                          {isTimeOnly ? (
                            <p className="level-time-only">
                              ⏱ Solo tiempo de espera — {formatDuration(levelReq.constructionTimeSeconds)}
                            </p>
                          ) : (
                            <ul>
                              {levelReq.itemRequirements.map((req) => {
                                const item = itemsLookup[req.itemId];
                                return (
                                  <li key={req.itemId} className={`requirement-item ${req.foundInRaid ? 'fir' : ''}`}>
                                    {item?.iconLink && (
                                      <img src={item.iconLink} alt="" className="requirement-icon" />
                                    )}
                                    <span>
                                      {item ? item.name : req.itemId} × {req.count}
                                      {req.foundInRaid && <span className="fir-tag"> (EN RAID)</span>}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <HideoutSummary stations={stations} itemsLookup={itemsLookup} />
      </div>
    </div>
  );
}