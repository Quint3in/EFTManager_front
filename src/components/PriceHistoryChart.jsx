import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import DateRangeSlider from './DateRangeSlider';
import { useTranslation } from '../hooks/useTranslation';

function formatDateShort(timestamp) {
  return new Date(timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatTooltipDate(timestamp) {
  return new Date(timestamp).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default function PriceHistoryChart({ priceHistory }) {
  const { t } = useTranslation();

  const allData = useMemo(
    () => priceHistory
      .map((p) => ({ timestamp: new Date(p.timestamp).getTime(), price: p.price, priceMin: p.priceMin }))
      .sort((a, b) => a.timestamp - b.timestamp),
    [priceHistory]
  );

  const minTs = allData[0]?.timestamp ?? 0;
  const maxTs = allData[allData.length - 1]?.timestamp ?? 0;

  const [range, setRange] = useState([minTs, maxTs]);
  const [draftRange, setDraftRange] = useState([minTs, maxTs]);

  useEffect(() => {
    setRange([minTs, maxTs]);
    setDraftRange([minTs, maxTs]);
  }, [minTs, maxTs]);

  const filteredData = useMemo(
    () => allData.filter((d) => d.timestamp >= range[0] && d.timestamp <= range[1]),
    [allData, range]
  );

  function applyPreset(type) {
    const endDate = new Date(maxTs);
    const startDate = new Date(endDate);

    if (type === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (type === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

    const newStart = Math.max(minTs, startDate.getTime());
    setRange([newStart, maxTs]);
    setDraftRange([newStart, maxTs]);
  }

  function resetRange() {
    setRange([minTs, maxTs]);
    setDraftRange([minTs, maxTs]);
  }

  if (allData.length === 0) return null;

  return (
    <div className="price-chart-wrap">
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={filteredData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#3a3f2e" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDateShort}
            stroke="#6f7566"
            tick={{ fontSize: 11, fontFamily: 'Share Tech Mono, monospace' }}
            minTickGap={40}
          />
          <YAxis
            stroke="#6f7566"
            tick={{ fontSize: 11, fontFamily: 'Share Tech Mono, monospace' }}
            tickFormatter={(v) => `₽${(v / 1000).toFixed(0)}k`}
            width={55}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#14170f',
              border: '1px solid #3a3f2e',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '0.78rem',
            }}
            labelFormatter={formatTooltipDate}
            formatter={(value, name) => [
              `₽${value.toLocaleString()}`,
              name === 'price' ? t('avgPrice') : t('minPriceLegend'),
            ]}
          />
          <Line type="monotone" dataKey="price" stroke="#f0b429" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="priceMin" stroke="#5b7a8c" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
        </LineChart>
      </ResponsiveContainer>

      <div className="price-chart-legend">
        <span className="legend-item"><span className="legend-dot amber" /> {t('avgPrice')}</span>
        <span className="legend-item"><span className="legend-dot steel" /> {t('minPriceLegend')}</span>
      </div>

      <div className="price-range-controls">
        <div className="price-range-presets">
          <button onClick={resetRange}>{t('all')}</button>
          <button onClick={() => applyPreset('year')}>{t('lastYear')}</button>
          <button onClick={() => applyPreset('month')}>{t('lastMonth')}</button>
        </div>
        <DateRangeSlider min={minTs} max={maxTs} value={range} onChange={setRange} onDraftChange={setDraftRange} />
        <div className="price-range-labels">
          <span>{formatDateShort(draftRange[0])}</span>
          <span>{formatDateShort(draftRange[1])}</span>
        </div>
      </div>
    </div>
  );
}