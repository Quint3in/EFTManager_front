export function buildMapsLookup(mapResponses) {
  const lookup = {};
  mapResponses.forEach((m) => {
    lookup[m.id] = m;
  });
  return lookup;
}