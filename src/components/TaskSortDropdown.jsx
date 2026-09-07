import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const SORT_OPTIONS = [
  { value: 'name_asc', labelKey: 'sortName', arrow: '↑' },
  { value: 'name_desc', labelKey: 'sortName', arrow: '↓' },
  { value: 'level_asc', labelKey: 'sortLevel', arrow: '↑' },
  { value: 'level_desc', labelKey: 'sortLevel', arrow: '↓' },
  { value: 'exp_asc', labelKey: 'sortExp', arrow: '↑' },
  { value: 'exp_desc', labelKey: 'sortExp', arrow: '↓' },
];

export default function TaskSortDropdown({ value, onChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  return (
    <div className="sort-dropdown" ref={ref}>
      <button className="sort-dropdown-trigger" onClick={() => setOpen((o) => !o)}>
        {t(current.labelKey)} {current.arrow}
        <span className={`user-menu-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="user-menu-dropdown sort-dropdown-menu">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`user-menu-item ${opt.value === value ? 'active' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {t(opt.labelKey)} {opt.arrow}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}