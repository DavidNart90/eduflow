import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context-simple';
import { ThemeProvider } from '@/lib/theme-context';
import { ErrorBoundary } from '@/components/ui';
import ToastContainer from '@/components/ui/ToastContainer';
import {
  PWAUpdateNotification,
  PWAInstallPrompt,
} from '@/components/PWAComponents';
import ServiceWorkerUpdatesProvider from '@/components/ServiceWorkerUpdatesProvider';

export const metadata: Metadata = {
  title: "Eduflow - Teachers' Savings Association",
  description:
    "Progressive Web App for the New Juaben Teachers' Savings Association",
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Eduflow',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Eduflow',
    'application-name': 'Eduflow',
    'msapplication-TileColor': '#1e293b',
    'msapplication-tap-highlight': 'no',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1e293b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning={true}>
      <head>
        {/* Service Worker Registration with memory leak prevention */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handling for chunk loading errors
              window.addEventListener('error', function(event) {
                const error = event.error || event;
                const isChunkError = error && (
                  error.message && (
                    error.message.includes('Loading chunk') ||
                    error.message.includes('ChunkLoadError') ||
                    error.message.includes('_next/static/chunks')
                  )
                );
                
                if (isChunkError) {
                  if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Chunk loading error detected, reloading page...', error.message);
                  }
                  // Small delay to avoid rapid reloads
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }
              });

              // Handle unhandled promise rejections
              window.addEventListener('unhandledrejection', function(event) {
                const error = event.reason;
                const isChunkError = error && error.message && (
                  error.message.includes('Loading chunk') ||
                  error.message.includes('ChunkLoadError') ||
                  error.message.includes('_next/static/chunks')
                );
                
                if (isChunkError) {
                  if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Chunk loading promise rejection, reloading page...', error.message);
                  }
                  event.preventDefault(); // Prevent unhandled rejection error
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }
              });

              if ('serviceWorker' in navigator && typeof window !== 'undefined') {
                let swRegistered = false;
                const registerServiceWorker = () => {
                  if (swRegistered) return;
                  
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      swRegistered = true;
                      if (typeof console !== 'undefined' && console.log) {
                        console.log('SW registered: ', registration);
                      }
                      
                      // Handle updates with better UX
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              // New version available - post message to main thread for toast notification
                              if (window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('sw-update-available', {
                                  detail: { registration, newWorker }
                                }));
                              }
                            }
                          });
                        }
                      });

                      // Listen for service worker messages
                      navigator.serviceWorker.addEventListener('message', (event) => {
                        if (event.data && event.data.type === 'SW_UPDATED') {
                          // Service worker updated successfully - dispatch custom event for UI notification
                          if (window.dispatchEvent) {
                            window.dispatchEvent(new CustomEvent('sw-updated', {
                              detail: {
                                message: event.data.message || 'App has been updated to the latest version.'
                              }
                            }));
                          }
                        }
                      });
                    })
                    .catch(function(registrationError) {
                      if (typeof console !== 'undefined' && console.log) {
                        console.log('SW registration failed: ', registrationError);
                      }
                    });
                };

                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', registerServiceWorker);
                } else {
                  registerServiceWorker();
                }

                // Cleanup on page unload
                window.addEventListener('beforeunload', () => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      // Don't unregister, just clean up listeners
                      registrations.forEach(registration => {
                        if (registration.active) {
                          // Clean up any message listeners
                        }
                      });
                    });
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className='antialiased' suppressHydrationWarning={true}>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <div suppressHydrationWarning={true}>
          <ToastContainer />
          <PWAUpdateNotification />
          <PWAInstallPrompt />
          <ServiceWorkerUpdatesProvider />
        </div>
      </body>
    </html>
  );
}
