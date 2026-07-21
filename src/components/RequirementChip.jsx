export default function RequirementChip({ type, imageLink, label, level }) {
  const initial = label ? label.charAt(0).toUpperCase() : '?';

  return (
    <div className={`req-chip ${type}`}>
      {imageLink ? (
        <img src={imageLink} alt="" className="req-chip-icon" />
      ) : (
        <div className="req-chip-icon req-chip-placeholder">{initial}</div>
      )}
      <span className="req-chip-label">{label} ≥{level}</span>
    </div>
  );
}