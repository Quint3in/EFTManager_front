import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from './useTranslation';
import { getPendingUnlocks, removePendingUnlock } from '../utils/pendingUnlocks';

export function usePendingUnlockChecker() {
  const { showToast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    function checkPending() {
      const pending = getPendingUnlocks();
      const now = Date.now();

      pending.forEach((p) => {
        if (now >= p.unlockAt) {
          showToast(`${p.taskName} ${t('nowAvailable')}`, 'info', 7000);
          removePendingUnlock(p.taskId, p.mode);
        }
      });
    }

    checkPending();
    const interval = setInterval(checkPending, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}