export function extractTraderIds(hideoutStations) {
  const ids = new Set();

  hideoutStations.forEach((station) => {
    station.remainingRequirements.forEach((levelReq) => {
      levelReq.traderRequirements.forEach((req) => {
        ids.add(req.traderId);
      });
    });
  });

  return Array.from(ids);
}

export function buildTradersLookup(traderResponses) {
  const lookup = {};
  traderResponses.forEach((trader) => {
    lookup[trader.id] = trader;
  });
  return lookup;
}