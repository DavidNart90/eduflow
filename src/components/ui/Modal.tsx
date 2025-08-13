'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  className?: string;
  animation?: 'fade' | 'slide' | 'scale' | 'slide-up';
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      size = 'md',
      closeOnBackdrop = true,
      showCloseButton = true,
      className,
      animation = 'fade',
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClose = useCallback(() => {
      if (isAnimating) return;
      setIsAnimating(true);
      setIsVisible(false);

      // Delay the actual close to allow animation to complete
      setTimeout(() => {
        onClose();
        setIsAnimating(false);
      }, 300);
    }, [isAnimating, onClose]);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        setIsVisible(true);
        setIsAnimating(false);
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, handleClose]);

    const handleBackdropClick = () => {
      if (closeOnBackdrop && !isAnimating) {
        handleClose();
      }
    };

    if (!isOpen && !isVisible) return null;

    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4',
    };

    const animationClasses = {
      fade: cn(
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      ),
      slide: cn(
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      ),
      scale: cn(
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      ),
      'slide-up': cn(
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      ),
    };

    const backdropClasses = cn(
      'fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out',
      isVisible ? 'opacity-100' : 'opacity-0'
    );

    return (
      <div className='fixed inset-0 z-50 overflow-y-auto'>
        {/* Backdrop */}
        <div className={backdropClasses} onClick={handleBackdropClick} />

        {/* Modal Container */}
        <div className='flex min-h-full items-center justify-center p-4'>
          <div
            ref={ref}
            className={cn(
              'relative bg-white rounded-2xl shadow-2xl w-full transform',
              'border border-secondary-200/60',
              animationClasses[animation],
              sizes[size],
              className
            )}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className='flex items-center justify-between p-6 border-b border-secondary-200/60'>
                {title && (
                  <h2 className='text-xl font-semibold text-secondary-900'>
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={handleClose}
                    className={cn(
                      'p-2 rounded-xl text-secondary-400 hover:text-secondary-600',
                      'hover:bg-secondary-100 transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                    )}
                    disabled={isAnimating}
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className='p-6'>{children}</div>
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

// Modal Header Component
interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  onClose?: () => void;
}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, title, subtitle, onClose, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between pb-6 border-b border-secondary-200/60',
          className
        )}
        {...props}
      >
        <div>
          <h2 className='text-xl font-semibold text-secondary-900'>{title}</h2>
          {subtitle && (
            <p className='text-sm text-secondary-600 mt-1'>{subtitle}</p>
          )}
        </div>
        <div className='flex items-center space-x-3'>
          {children}
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-xl text-secondary-400 hover:text-secondary-600',
                'hover:bg-secondary-100 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
              )}
            >
              <svg
                className='w-5 h-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

ModalHeader.displayName = 'ModalHeader';

// Modal Content Component
interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('py-6', className)} {...props}>
        {children}
      </div>
    );
  }
);

ModalContent.displayName = 'ModalContent';

// Modal Footer Component
interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end space-x-3 pt-6 border-t border-secondary-200/60',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = 'ModalFooter';

export default Modal;
