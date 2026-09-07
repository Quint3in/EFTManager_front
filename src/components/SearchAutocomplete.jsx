import { useEffect, useRef, useState } from 'react';

export default function SearchAutocomplete({
  value, onChange, fetchSuggestions, onSelect, renderSuggestion,
  placeholder, minChars = 2, className = '',
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value || value.trim().length < minChars) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(value.trim());
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleSelect(suggestion) {
    setOpen(false);
    onSelect(suggestion);
  }

  return (
    <div className="autocomplete-wrap" ref={wrapRef}>
      <input
        type="text"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="autocomplete-dropdown">
          {suggestions.map((s, i) => (
            <button key={s.id || s.username || i} className="autocomplete-item" onClick={() => handleSelect(s)}>
              {renderSuggestion(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}