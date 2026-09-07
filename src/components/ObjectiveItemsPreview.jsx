export default function ObjectiveItemsPreview({ itemIds, lookup }) {
  const resolved = itemIds.map((id) => lookup[id]).filter(Boolean);
  if (resolved.length === 0) return null;

  const representative = resolved[0];

  return (
    <div className="objective-items-preview">
      <img src={representative.iconLink} alt={representative.name} className="objective-preview-icon" />
      <div className="objective-items-popover">
        <p className="objective-popover-title">{resolved.length}</p>
        <ul>
          {resolved.map((item) => (
            <li key={item.id}>
              <img src={item.iconLink} alt="" />
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}