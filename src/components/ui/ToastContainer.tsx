'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Toast from './Toast';
import { useAppStore } from '@/lib/stores';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  // Don't render on server-side
  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <div className='fixed top-4 right-4 z-50 flex flex-col space-y-3 pointer-events-none'>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
          closable={toast.closable}
        />
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;
