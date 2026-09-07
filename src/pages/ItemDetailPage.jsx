import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useGameMode } from '../context/GameModeContext';
import { useLanguage } from '../context/LanguageContext';
import { buildTradersLookup } from '../utils/hideoutTraders';
import { buildItemsLookup } from '../utils/hideoutItems';
import { useTranslation } from '../hooks/useTranslation';
import PriceHistoryChart from '../components/PriceHistoryChart';
import '../styles/item-detail.css';
import FavoriteButton from '../components/FavoriteButton';

export default function ItemDetailPage() {
  const { itemId } = useParams();
  const { mode } = useGameMode();
  const { language } = useLanguage();
  const [item, setItem] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [barters, setBarters] = useState([]);
  const [tradersLookup, setTradersLookup] = useState({});
  const [barterItemsLookup, setBarterItemsLookup] = useState({});
  const [buySortDir, setBuySortDir] = useState('asc');
  const [sellSortDir, setSellSortDir] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, itemId, language]);

  async function loadDetail() {
    setLoading(true);
    setError('');
    try {
      const { data: itemsData } = await axiosClient.get('/items', { params: { mode, lang: language, ids: itemId } });
      const foundItem = itemsData[0] || null;
      setItem(foundItem);

      if (!foundItem) {
        setError('Ítem no encontrado');
        return;
      }

      try {
        const { data: pricesData } = await axiosClient.get(`/prices/${itemId}`, { params: { mode } });
        setPriceHistory(pricesData);
      } catch {
        setPriceHistory([]);
      }

      let barterList = [];
      try {
        const { data: bartersData } = await axiosClient.get(`/barters/${itemId}`, { params: { mode } });
        barterList = bartersData;
        setBarters(bartersData);
      } catch {
        setBarters([]);
      }

      const traderIds = new Set([
        ...(foundItem.buyFromTraderOptions || []).map((o) => o.traderId),
        ...(foundItem.sellToTraderOptions || []).map((o) => o.traderId),
        ...barterList.map((b) => b.traderId),
      ]);

      if (traderIds.size > 0) {
        const { data: tradersData } = await axiosClient.get('/traders', {
          params: { mode, lang: language, ids: Array.from(traderIds).join(',') },
        });
        setTradersLookup(buildTradersLookup(tradersData));
      }

      const requiredItemIds = new Set();
      barterList.forEach((b) => b.requiredItems.forEach((r) => requiredItemIds.add(r.itemId)));

      if (requiredItemIds.size > 0) {
        const { data: barterItemsData } = await axiosClient.get('/items', {
          params: { mode, ids: Array.from(requiredItemIds).join(','), lang: language },
        });
        setBarterItemsLookup(buildItemsLookup(barterItemsData));
      }
    } catch (err) {
      setError('No se pudo cargar el ítem');
    } finally {
      setLoading(false);
    }
  }

  const sortedBuyOptions = useMemo(() => {
    const options = [...(item?.buyFromTraderOptions || [])];
    options.sort((a, b) => (buySortDir === 'asc' ? a.priceRUB - b.priceRUB : b.priceRUB - a.priceRUB));
    return options;
  }, [item, buySortDir]);

  const sortedSellOptions = useMemo(() => {
    const options = [...(item?.sellToTraderOptions || [])];
    options.sort((a, b) => (sellSortDir === 'asc' ? a.priceRUB - b.priceRUB : b.priceRUB - a.priceRUB));
    return options;
  }, [item, sellSortDir]);

  if (loading) return <p className="hideout-loading">{t('loading')}</p>;
  if (error) return <div className="hideout-error">{error}</div>;
  if (!item) return <p className="hideout-loading">{t('itemNotFound')}</p>;

  const lastPoint = priceHistory[priceHistory.length - 1];
  const minPoint = priceHistory.reduce(
    (min, p) => (p.priceMin < (min?.priceMin ?? Infinity) ? p : min),
    null
  );

  return (
    <div className="item-detail-page">
      <button onClick={() => navigate(-1)} className="back-link back-link-btn">{t('backToItems')}</button>

      <div className="item-detail-header">
        {item.iconLink && <img src={item.iconLink} alt={item.name} className="item-detail-icon" />}
        <div>
          <div className="item-detail-title-row">
            <h2>{item.name}</h2>
            <FavoriteButton itemId={item.id} />
          </div>
          <p className="item-detail-short">{item.shortName}</p>
          <p className="item-detail-weight">{t('weight')}: {item.weight} kg</p>
            {item.canSellOnFlea && item.minLevelForFlea > 0 && (
              <p className="item-detail-weight">{t('minLevelFlea')}: {item.minLevelForFlea}</p>
            )}
        </div>
      </div>

      <section className="item-detail-section chart-section">
        <h3>{t('priceHistory')}</h3>
          {!item.canSellOnFlea ? (
            <p className="summary-empty">{t('cannotSellMarket')}</p>
          ) : priceHistory.length === 0 ? (
            <p className="summary-empty">{t('noMarketDataYet')}</p>
          ) : (
          <>
            <div className="price-highlights">
              <div>
                <p className="price-highlight-label">{t('lastPrice')}</p>
                <p className="price-highlight-value">₽{lastPoint.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="price-highlight-label">{t('minHistoric')}</p>
                <p className="price-highlight-value">₽{minPoint.priceMin.toLocaleString()}</p>
              </div>
            </div>
            <PriceHistoryChart priceHistory={priceHistory} />
          </>
        )}
      </section>

      <div className="item-detail-columns">
        <section className="item-detail-section">
          <h3>{t('buyFromTraders')}</h3>

          {sortedBuyOptions.length === 0 && barters.length === 0 ? (
            <p className="summary-empty">{t('noTraderBuys')}</p>
          ) : (
            <>
              {sortedBuyOptions.length > 0 && (
                <table className="offers-table">
                  <thead>
                    <tr>
                      <th className="offers-th-icon"></th>
                      <th>Trader</th>
                      <th
                        className="offers-th-sortable"
                        onClick={() => setBuySortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                      >
                        {t('price')} {buySortDir === 'asc' ? '▲' : '▼'}
                      </th>
                      <th>{t('level')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBuyOptions.map((option, i) => {
                      const trader = tradersLookup[option.traderId];
                      return (
                        <tr key={i}>
                          <td>
                            {trader?.imageLink && (
                              <img src={trader.imageLink} alt="" className="offer-trader-icon" />
                            )}
                          </td>
                          <td>{trader ? trader.name : option.traderId}</td>
                          <td className="offer-price-cell">
                            <span className="offer-price">{option.price} {option.currency}</span>
                            <span className="offer-price-rub">≈ ₽{option.priceRUB.toLocaleString()}</span>
                          </td>
                          <td>≥{option.minTraderLevel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {barters.length > 0 && (
                <div className="barters-block">
                  <p className="barters-title">{t('barters')}</p>
                  <ul className="barters-list">
                    {barters.map((barter, i) => {
                      const trader = tradersLookup[barter.traderId];
                      return (
                        <li key={i} className="barter-row">
                          <div className="barter-trader">
                            {trader?.imageLink && (
                              <img src={trader.imageLink} alt="" className="offer-trader-icon" />
                            )}
                            <span>{trader ? trader.name : barter.traderId}</span>
                            <span className="buy-option-meta">≥{barter.minTraderLevel}</span>
                          </div>
                          <div className="barter-required">
                            {barter.requiredItems.map((req, j) => {
                              const reqItem = barterItemsLookup[req.itemId];
                              return (
                                <span key={j} className="barter-required-item">
                                  {reqItem?.iconLink && (
                                    <img src={reqItem.iconLink} alt="" className="barter-item-icon" />
                                  )}
                                  {reqItem ? reqItem.name : req.itemId} × {req.count}
                                </span>
                              );
                            })}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>

        <section className="item-detail-section">
          <h3>{t('sellToTraders')}</h3>
          {sortedSellOptions.length === 0 ? (
            <p className="summary-empty">{t('noTraderSells')}</p>
          ) : (
            <table className="offers-table">
              <thead>
                <tr>
                  <th className="offers-th-icon"></th>
                  <th>Trader</th>
                  <th
                    className="offers-th-sortable"
                    onClick={() => setSellSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  >
                    {t('price')} {sellSortDir === 'asc' ? '▲' : '▼'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSellOptions.map((option, i) => {
                  const trader = tradersLookup[option.traderId];
                  return (
                    <tr key={i}>
                      <td>
                        {trader?.imageLink && (
                          <img src={trader.imageLink} alt="" className="offer-trader-icon" />
                        )}
                      </td>
                      <td>{trader ? trader.name : option.traderId}</td>
                      <td className="offer-price-cell">
                        <span className="offer-price">{option.price} {option.currency}</span>
                        <span className="offer-price-rub">≈ ₽{option.priceRUB.toLocaleString()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}