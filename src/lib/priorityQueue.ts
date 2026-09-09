/**
 * Cola de navegación "Prioridades de hoy": guarda el orden de las órdenes
 * pendientes para poder saltar Anterior / Siguiente desde el detalle.
 */
const KEY = "tgz_priority_queue";

export const savePriorityQueue = (ids: string[]) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
};

export const getPriorityQueue = (): string[] => {
  try {
    const raw = sessionStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

export const getNeighbors = (id?: string) => {
  const queue = getPriorityQueue();
  const idx = id ? queue.indexOf(id) : -1;
  return {
    inQueue: idx >= 0,
    prev: idx > 0 ? queue[idx - 1] : null,
    next: idx >= 0 && idx < queue.length - 1 ? queue[idx + 1] : null,
    position: idx + 1,
    total: queue.length,
  };
};
