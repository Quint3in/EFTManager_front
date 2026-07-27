export function extractSkillIds(hideoutStations) {
  const ids = new Set();

  hideoutStations.forEach((station) => {
    station.remainingRequirements.forEach((levelReq) => {
      levelReq.skillRequirements.forEach((req) => {
        ids.add(req.skill);
      });
    });
  });

  return Array.from(ids);
}

export function buildSkillsLookup(skillResponses) {
  const lookup = {};
  skillResponses.forEach((skill) => {
    lookup[skill.id] = skill;
  });
  return lookup;
}

// Fallback si el catálogo no resuelve el código (p.ej. "HideoutManagement" -> "Hideout Management")
export function formatSkillCode(code) {
  if (!code) return code;
  return code.replace(/([a-z])([A-Z])/g, '$1 $2');
}