import { useMemo, useState } from 'react';
import { buildCategoryTree } from '../utils/marketCategories';
import { useTranslation } from '../hooks/useTranslation';

function CategoryNode({ node, selectedId, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <li className="category-node-li">
      <div className="category-node-row">
        {hasChildren ? (
          <button className="category-toggle" onClick={() => setExpanded((e) => !e)}>
            {expanded ? '−' : '+'}
          </button>
        ) : (
          <span className="category-toggle-spacer" />
        )}
        <button
          className={`category-node ${selectedId === node.id ? 'active' : ''}`}
          onClick={() => onSelect(node.id)}
        >
          {node.name} <span className="category-count">{node.itemCount}</span>
        </button>
      </div>
      {expanded && hasChildren && (
        <ul className="category-children">
          {node.children.map((child) => (
            <CategoryNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoryFilterTree({ categories, selectedId, onSelect }) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const { t } = useTranslation();

  return (
    <div className="category-tree">
      <button
        className={`category-node category-node-all ${!selectedId ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        {t('allCategories')} <span className="category-count">{categories.length}</span>
      </button>
      <ul className="category-root-list">
        {tree.map((node) => (
          <CategoryNode key={node.id} node={node} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </ul>
    </div>
  );
}