import { aggregateRequirements } from '../utils/hideoutItems';
import '../styles/hideout-summary.css';

function RaidIcon() {
  return (
    <svg className="summary-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function TradeIcon() {
  return (
    <svg className="summary-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h3.5a1.5 1.5 0 0 1 0 3H9m0 0h3.5a1.5 1.5 0 0 1 0 3H9m3-9v9" />
    </svg>
  );
}

export default function HideoutSummary({ stations, itemsLookup }) {
  const { foundInRaid, regular } = aggregateRequirements(stations);

  if (foundInRaid.length === 0 && regular.length === 0) {
    return null;
  }

  return (
    <aside className="hideout-summary">
      <div className="summary-section raid">
        <div className="summary-header">
          <RaidIcon />
          <span className="summary-title">En Raid</span>
          <span className="summary-count">{foundInRaid.length}</span>
        </div>
        <p className="summary-note">
          Los ítems crafteados en el hideout también cuentan como "Encontrado en Raid".
        </p>
        {foundInRaid.length === 0 ? (
          <p className="summary-empty">Nada pendiente</p>
        ) : (
          <ul>
            {foundInRaid.map((req) => {
              const item = itemsLookup[req.itemId];
              return (
                <li key={req.itemId}>
                  {item?.iconLink && <img src={item.iconLink} alt="" className="summary-icon" />}
                  <span>{item ? item.name : req.itemId} × {req.count}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="summary-section regular">
        <div className="summary-header">
          <TradeIcon />
          <span className="summary-title">Mercado / Craft</span>
          <span className="summary-count">{regular.length}</span>
        </div>
        {regular.length === 0 ? (
          <p className="summary-empty">Nada pendiente</p>
        ) : (
          <ul>
            {regular.map((req) => {
              const item = itemsLookup[req.itemId];
              return (
                <li key={req.itemId}>
                  {item?.iconLink && <img src={item.iconLink} alt="" className="summary-icon" />}
                  <span>{item ? item.name : req.itemId} × {req.count}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}