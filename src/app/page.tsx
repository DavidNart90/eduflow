'use client';

import { useState } from 'react';

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('Testing connection...');

    try {
      const response = await fetch('/api/test-connection');
      const result = await response.json();

      if (result.success) {
        setConnectionStatus('✅ Database connection successful!');
      } else {
        setConnectionStatus(`❌ Connection failed: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus(
        `❌ Error testing connection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <main className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold text-primary-500 mb-4'>
              EduFlow
            </h1>
            <p className='text-xl text-secondary-600'>
              Teachers&apos; Savings Management System
            </p>
          </div>

          {/* Database Connection Test */}
          <div className='mb-12 p-6 bg-white rounded-lg shadow-soft border border-secondary-200'>
            <h2 className='text-2xl font-semibold text-foreground mb-4'>
              Database Connection Test
            </h2>
            <div className='space-y-4'>
              <button
                onClick={testConnection}
                disabled={isTesting}
                className='px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50'
              >
                {isTesting ? 'Testing...' : 'Test Database Connection'}
              </button>
              {connectionStatus && (
                <div className='p-4 rounded-lg bg-secondary-50 border border-secondary-200'>
                  <p className='text-sm'>{connectionStatus}</p>
                </div>
              )}
            </div>
          </div>

          {/* Design System Test */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
            {/* Primary Colors */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-foreground'>
                Primary Colors
              </h3>
              <div className='space-y-2'>
                <div className='h-12 bg-primary-500 rounded-lg flex items-center justify-center text-white font-medium'>
                  Primary 500
                </div>
                <div className='h-8 bg-primary-400 rounded-lg flex items-center justify-center text-white text-sm'>
                  Primary 400
                </div>
                <div className='h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-sm'>
                  Primary 600
                </div>
              </div>
            </div>

            {/* Success Colors */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-foreground'>
                Success Colors
              </h3>
              <div className='space-y-2'>
                <div className='h-12 bg-success-500 rounded-lg flex items-center justify-center text-white font-medium'>
                  Success 500
                </div>
                <div className='h-8 bg-success-400 rounded-lg flex items-center justify-center text-white text-sm'>
                  Success 400
                </div>
                <div className='h-8 bg-success-600 rounded-lg flex items-center justify-center text-white text-sm'>
                  Success 600
                </div>
              </div>
            </div>

            {/* Warning Colors */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-foreground'>
                Warning Colors
              </h3>
              <div className='space-y-2'>
                <div className='h-12 bg-warning-500 rounded-lg flex items-center justify-center text-white font-medium'>
                  Warning 500
                </div>
                <div className='h-8 bg-warning-400 rounded-lg flex items-center justify-center text-white text-sm'>
                  Warning 400
                </div>
                <div className='h-8 bg-warning-600 rounded-lg flex items-center justify-center text-white text-sm'>
                  Warning 600
                </div>
              </div>
            </div>

            {/* Error Colors */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-foreground'>
                Error Colors
              </h3>
              <div className='space-y-2'>
                <div className='h-12 bg-error-500 rounded-lg flex items-center justify-center text-white font-medium'>
                  Error 500
                </div>
                <div className='h-8 bg-error-400 rounded-lg flex items-center justify-center text-white text-sm'>
                  Error 400
                </div>
                <div className='h-8 bg-error-600 rounded-lg flex items-center justify-center text-white text-sm'>
                  Error 600
                </div>
              </div>
            </div>
          </div>

          {/* Typography Test */}
          <div className='space-y-6 mb-12'>
            <h2 className='text-2xl font-semibold text-foreground'>
              Typography
            </h2>
            <div className='space-y-4'>
              <h1 className='text-4xl font-bold text-foreground'>
                Heading 1 - 4xl
              </h1>
              <h2 className='text-3xl font-semibold text-foreground'>
                Heading 2 - 3xl
              </h2>
              <h3 className='text-2xl font-semibold text-foreground'>
                Heading 3 - 2xl
              </h3>
              <h4 className='text-xl font-semibold text-foreground'>
                Heading 4 - xl
              </h4>
              <p className='text-base text-secondary-600'>
                Body text - This is a sample paragraph to test the Inter font
                family and line height.
              </p>
              <p className='text-sm text-secondary-500'>
                Small text - This is smaller text for captions and secondary
                information.
              </p>
            </div>
          </div>

          {/* Component Examples */}
          <div className='space-y-6'>
            <h2 className='text-2xl font-semibold text-foreground'>
              Component Examples
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Buttons */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-foreground'>
                  Buttons
                </h3>
                <div className='space-y-3'>
                  <button className='px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors'>
                    Primary Button
                  </button>
                  <button className='px-6 py-3 bg-success-500 text-white rounded-lg font-medium hover:bg-success-600 transition-colors'>
                    Success Button
                  </button>
                  <button className='px-6 py-3 border border-secondary-300 text-foreground rounded-lg font-medium hover:bg-secondary-50 transition-colors'>
                    Secondary Button
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-foreground'>Cards</h3>
                <div className='p-6 bg-white rounded-lg shadow-soft border border-secondary-200'>
                  <h4 className='text-lg font-semibold text-foreground mb-2'>
                    Card Title
                  </h4>
                  <p className='text-secondary-600 mb-4'>
                    This is a sample card component with soft shadow and rounded
                    corners.
                  </p>
                  <button className='px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors'>
                    Action
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
