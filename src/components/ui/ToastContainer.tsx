'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Toast from './Toast';
import { useAppStore } from '@/lib/stores';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always render the container div to avoid hydration mismatch
  const containerDiv = (
    <div className='fixed top-4 right-4 z-50 flex flex-col space-y-3 pointer-events-none'>
      {isMounted &&
        toasts.map(toast => (
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
    </div>
  );

  // Only use portal on client side
  if (typeof window === 'undefined') {
    return containerDiv;
  }

  return createPortal(containerDiv, document.body);
};

export default ToastContainer;
