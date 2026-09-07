const STORAGE_KEY = 'pendingTaskUnlocks';

export function getPendingUnlocks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function addPendingUnlock(taskId, taskName, mode, unlockAt) {
  const current = getPendingUnlocks().filter((p) => !(p.taskId === taskId && p.mode === mode));
  current.push({ taskId, taskName, mode, unlockAt });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function removePendingUnlock(taskId, mode) {
  const current = getPendingUnlocks().filter((p) => !(p.taskId === taskId && p.mode === mode));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function formatDelay(totalSeconds) {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (hours === 0 && seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}