import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LANGUAGE_OPTIONS.find((o) => o.code === language) || LANGUAGE_OPTIONS[0];

  return (
    <div className="lang-selector" ref={ref}>
      <button className="lang-selector-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="lang-flag">{current.flag}</span>
        <span className={`user-menu-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="user-menu-dropdown lang-dropdown">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              className={`user-menu-item lang-item ${opt.code === language ? 'active' : ''}`}
              onClick={() => {
                setLanguage(opt.code);
                setOpen(false);
              }}
            >
              <span className="lang-flag">{opt.flag}</span> {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}