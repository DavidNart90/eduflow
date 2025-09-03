'use client';

import { useAppStore } from '@/lib/stores';

/**
 * Custom hook for using toast notifications
 * Provides convenient methods for showing different types of toasts
 */
export const useToast = () => {
  const {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    toasts,
  } = useAppStore();

  return {
    // Direct toast functions
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Advanced toast control
    addToast,
    removeToast,
    toasts,

    // Convenience methods
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
  };
};

export default useToast;
