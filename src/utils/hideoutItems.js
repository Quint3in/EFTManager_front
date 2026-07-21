export function extractItemIds(hideoutStations) {
  const ids = new Set();

  hideoutStations.forEach((station) => {
    station.remainingRequirements.forEach((levelReq) => {
      levelReq.itemRequirements.forEach((itemReq) => {
        ids.add(itemReq.itemId);
      });
    });
  });

  return Array.from(ids);
}

export function buildItemsLookup(itemResponses) {
  const lookup = {};
  itemResponses.forEach((item) => {
    lookup[item.id] = item;
  });
  return lookup;
}

export function aggregateRequirements(hideoutStations) {
  const map = {};

  hideoutStations.forEach((station) => {
    station.remainingRequirements.forEach((levelReq) => {
      levelReq.itemRequirements.forEach((req) => {
        const key = `${req.itemId}-${req.foundInRaid}`;
        if (!map[key]) {
          map[key] = { itemId: req.itemId, foundInRaid: req.foundInRaid, count: 0 };
        }
        map[key].count += req.count;
      });
    });
  });

  const all = Object.values(map);

  return {
    foundInRaid: all.filter((r) => r.foundInRaid),
    regular: all.filter((r) => !r.foundInRaid),
  };
}

export function formatDuration(totalSeconds) {
  if (totalSeconds <= 0) return 'Instantáneo';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}