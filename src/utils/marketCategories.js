export function buildCategoryTree(categories) {
  const byId = {};
  categories.forEach((c) => {
    byId[c.id] = { ...c, children: [] };
  });

  const roots = [];
  categories.forEach((c) => {
    if (c.parentId && byId[c.parentId]) {
      byId[c.parentId].children.push(byId[c.id]);
    } else {
      roots.push(byId[c.id]);
    }
  });


  return roots.flatMap((root) =>
    root.normalizedName?.toLowerCase() === 'item' ? root.children : [root]
  );
}