'use client';

import { useEffect, useRef } from 'react';
import { useToast } from './useToast';

export function useServiceWorkerUpdates() {
  const { showInfo, showSuccess } = useToast();
  const hasShownUpdateNotification = useRef(false);

  useEffect(() => {
    const handleUpdateAvailable = (event: CustomEvent) => {
      const { newWorker } = event.detail;

      // Prevent duplicate notifications
      if (hasShownUpdateNotification.current) return;
      hasShownUpdateNotification.current = true;

      showInfo(
        'Update Available',
        'A new version is available. The app will automatically update on next reload.'
      );

      // Auto-update after a short delay to allow user to see the notification
      setTimeout(() => {
        if (newWorker) {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }, 3000);
    };

    const handleServiceWorkerUpdated = (event: CustomEvent) => {
      const { message } = event.detail;
      showSuccess(
        'Updated Successfully',
        message || 'App has been updated to the latest version.'
      );
    };

    // Add event listeners
    window.addEventListener(
      'sw-update-available' as keyof WindowEventMap,
      handleUpdateAvailable as EventListener
    );
    window.addEventListener(
      'sw-updated' as keyof WindowEventMap,
      handleServiceWorkerUpdated as EventListener
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        'sw-update-available' as keyof WindowEventMap,
        handleUpdateAvailable as EventListener
      );
      window.removeEventListener(
        'sw-updated' as keyof WindowEventMap,
        handleServiceWorkerUpdated as EventListener
      );
    };
  }, [showInfo, showSuccess]);

  return null;
}
