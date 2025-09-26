'use client';

import { useServiceWorkerUpdates } from '@/hooks/useServiceWorkerUpdates';

export default function ServiceWorkerUpdatesProvider() {
  // This component uses the useServiceWorkerUpdates hook to handle update notifications
  useServiceWorkerUpdates();

  // This component doesn't render anything, it just provides the service worker update functionality
  return null;
}
