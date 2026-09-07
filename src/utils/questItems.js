export function extractObjectiveItemIds(objectives) {
  const ids = new Set();
  objectives.forEach((obj) => {
    (obj.itemIds || []).forEach((id) => ids.add(id));
  });
  return Array.from(ids);
}

export function buildQuestItemsLookup(questItemResponses) {
  const lookup = {};
  questItemResponses.forEach((item) => {
    lookup[item.id] = item;
  });
  return lookup;
}