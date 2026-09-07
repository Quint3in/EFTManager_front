const TYPE_LABELS = {
  es: {
    visit: 'Visitar',
    giveItem: 'Entregar ítem',
    findItem: 'Encontrar ítem',
    shoot: 'Eliminar',
    plantItem: 'Colocar ítem',
    extract: 'Extraer',
    mark: 'Marcar',
    useItem: 'Usar ítem',
  },
  en: {
    visit: 'Visit',
    giveItem: 'Give item',
    findItem: 'Find item',
    shoot: 'Eliminate',
    plantItem: 'Plant item',
    extract: 'Extract',
    mark: 'Mark',
    useItem: 'Use item',
  },
};

export function formatObjectiveType(type, language) {
  const dict = TYPE_LABELS[language] || TYPE_LABELS.en;
  return dict[type] || type;
}