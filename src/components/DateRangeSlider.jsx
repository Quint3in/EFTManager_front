import { useEffect, useRef, useState } from 'react';

export default function DateRangeSlider({ min, max, value, onChange, onDraftChange }) {
  const [draft, setDraft] = useState(value);
  const rafRef = useRef(null);
  const pendingRef = useRef(null);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingRef.current = null;
    setDraft(value);
  }, [value]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  function currentDraft() {
    return pendingRef.current ?? draft;
  }

  function scheduleDraftUpdate(next) {
    pendingRef.current = next;
    if (rafRef.current) return; // ya hay una actualización pendiente para este frame
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setDraft(pendingRef.current);
      onDraftChange?.(pendingRef.current);
    });
  }

  function handleStartInput(e) {
    const newStart = Number(e.target.value);
    const [, end] = currentDraft();
    scheduleDraftUpdate([Math.min(newStart, end), end]);
  }

  function handleEndInput(e) {
    const newEnd = Number(e.target.value);
    const [start] = currentDraft();
    scheduleDraftUpdate([start, Math.max(newEnd, start)]);
  }

  function commit() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onChange(currentDraft());
  }

  const [start, end] = draft;
  const range = max - min || 1;
  const startPercent = ((start - min) / range) * 100;
  const endPercent = ((end - min) / range) * 100;

  return (
    <div className="range-slider">
      <div className="range-slider-track" />
      <div
        className="range-slider-fill"
        style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
      />
      <input type="range" min={min} max={max} value={start} onChange={handleStartInput} onMouseUp={commit} onTouchEnd={commit} onKeyUp={commit} className="range-slider-input" />
      <input type="range" min={min} max={max} value={end} onChange={handleEndInput} onMouseUp={commit} onTouchEnd={commit} onKeyUp={commit} className="range-slider-input" />
    </div>
  );
}