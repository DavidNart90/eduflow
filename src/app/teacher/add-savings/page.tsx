'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-optimized';
import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';
import {
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';

interface MobileNetwork {
  id: string;
  name: string;
  shortCode: string;
  color: string;
  icon: string;
}

interface PaymentStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export default function AddSavingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>(
    'form'
  );
  const [amount, setAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentReference, setPaymentReference] = useState('');

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Mobile networks data with actual images
  const mobileNetworks: MobileNetwork[] = [
    {
      id: 'MTN',
      name: 'MTN Mobile Money',
      shortCode: 'MTN',
      color: 'bg-yellow-500',
      icon: '/mobile network logo/mtn momo.webp',
    },
    {
      id: 'VODAFONE',
      name: 'Telecel Cash',
      shortCode: 'TELECEL',
      color: 'bg-blue-500',
      icon: '/mobile network logo/telecel cash.webp',
    },
    {
      id: 'AIRTELTIGO',
      name: 'AirtelTigo Money',
      shortCode: 'AT',
      color: 'bg-red-500',
      icon: '/mobile network logo/AT Money.jpeg',
    },
  ];

  // Payment steps
  const paymentSteps: PaymentStep[] = [
    {
      id: 1,
      title: 'Enter Details',
      description: 'Amount and payment method',
      completed: step !== 'form',
      current: step === 'form',
    },
    {
      id: 2,
      title: 'Process Payment',
      description: 'Secure payment processing',
      completed: step === 'success',
      current: step === 'processing',
    },
    {
      id: 3,
      title: 'Confirmation',
      description: 'Payment confirmation',
      completed: step === 'success',
      current: step === 'success' || step === 'error',
    },
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseFloat(amount) < 1) {
      newErrors.amount = 'Minimum amount is GHS 1.00';
    } else if (parseFloat(amount) > 10000) {
      newErrors.amount = 'Maximum amount is GHS 10,000.00';
    }

    if (!selectedNetwork) {
      newErrors.network = 'Please select a mobile network';
    }

    if (!phoneNumber) {
      newErrors.phoneNumber = 'Please enter your phone number';
    } else if (!/^0[2-9]\d{8}$/.test(phoneNumber)) {
      newErrors.phoneNumber =
        'Please enter a valid Ghana phone number (e.g., 0241234567)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Form Error', 'Please correct the errors below and try again');
      return;
    }

    setSubmitting(true);
    setStep('processing');

    try {
      // Call our payment initialization API
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          phone: phoneNumber,
          network: selectedNetwork,
          metadata: {
            user_id: user?.id,
            email: user?.email,
          },
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setPaymentReference(result.data.reference);
        showSuccess(
          'Payment Initiated',
          'Check your phone for payment authorization'
        );

        // For mobile money, check the status
        if (result.data.status === 'pay_offline') {
          // Show the instruction to the user and start polling
          setStep('processing');
          pollPaymentStatus(result.data.reference);
        } else if (result.data.status === 'success') {
          // Payment completed immediately
          setStep('success');
          showSuccess(
            'Payment Successful',
            'Your savings contribution has been added successfully'
          );
        } else {
          // Other status - start polling
          setStep('processing');
          pollPaymentStatus(result.data.reference);
        }
      } else {
        // Payment initialization failed
        setStep('error');
        showError(
          'Payment Failed',
          result.message || 'Failed to initialize payment'
        );
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Payment initialization failed:', result.message);
          // eslint-disable-next-line no-console
          console.error('Full result:', result);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Payment error:', error);
      }
      setStep('error');
      showError(
        'Network Error',
        'Failed to connect to payment service. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setStep('form');
    setErrors({});
    setPaymentReference('');
  };

  // Poll payment status
  const pollPaymentStatus = (reference: string) => {
    const maxAttempts = 30; // Poll for up to 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(
          `/api/payments/verify?reference=${reference}`
        );
        const result = await response.json();

        if (result.status === 'success') {
          const { data } = result;

          if (data.status === 'success') {
            setStep('success');
            showSuccess(
              'Payment Successful',
              'Your savings contribution has been added successfully'
            );
            return;
          } else if (data.status === 'failed') {
            setStep('error');
            showError('Payment Failed', 'Your payment was declined or failed');
            return;
          }
        }

        // Continue polling if still pending and within max attempts
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          // Timeout - payment is taking too long
          setStep('error');
          showError(
            'Payment Timeout',
            'Payment is taking too long. Please try again or contact support'
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Status polling error:', error);
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setStep('error');
          showError(
            'Payment Timeout',
            'Payment verification is taking too long. Please contact support'
          );
        }
      }
    };

    // Start polling after a 3 second delay
    setTimeout(poll, 3000);
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    router.push('/teacher/dashboard');
  };

  return (
    <TeacherRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {isLoading ? (
            <>
              {/* Loading Header */}
              <div className='mb-6 md:mb-8'>
                <div className='lg:w-full text-center'>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={300}
                    height={48}
                    animation='pulse'
                    className='mx-auto mb-3 rounded-lg'
                  />
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={400}
                    height={24}
                    animation='pulse'
                    className='mx-auto mb-2 rounded-lg'
                  />
                </div>
              </div>

              {/* Loading Progress Steps */}
              <div className='max-w-2xl mx-auto mb-8'>
                <div className='flex items-center justify-center space-x-8'>
                  {[1, 2, 3].map((step, index) => (
                    <div key={step} className='flex items-center'>
                      <MuiSkeletonComponent
                        variant='circular'
                        width={40}
                        height={40}
                        animation='pulse'
                      />
                      {index < 2 && (
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={80}
                          height={4}
                          animation='pulse'
                          className='mx-4 rounded-full'
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Loading Main Card */}
              <div className='max-w-4xl mx-auto'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-4 md:p-8'>
                    {/* Loading Form */}
                    <div className='space-y-6'>
                      <div>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={120}
                          height={20}
                          animation='pulse'
                          className='mb-3 rounded-lg'
                        />
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={'100%'}
                          height={48}
                          animation='pulse'
                          className='rounded-lg'
                        />
                      </div>

                      <div>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={150}
                          height={20}
                          animation='pulse'
                          className='mb-3 rounded-lg'
                        />
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                          {[1, 2, 3].map(item => (
                            <MuiSkeletonComponent
                              key={item}
                              variant='rectangular'
                              width={'100%'}
                              height={80}
                              animation='pulse'
                              className='rounded-lg'
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={180}
                          height={20}
                          animation='pulse'
                          className='mb-3 rounded-lg'
                        />
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={'100%'}
                          height={48}
                          animation='pulse'
                          className='rounded-lg'
                        />
                      </div>

                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={120}
                        animation='pulse'
                        className='rounded-lg'
                      />

                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={48}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Loading Footer */}
                <div className='text-center'>
                  <div className='inline-flex items-center space-x-6'>
                    {[1, 2, 3].map(item => (
                      <MuiSkeletonComponent
                        key={item}
                        variant='rectangular'
                        width={120}
                        height={20}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className='mb-6 md:mb-8'>
                <div className='lg:w-full text-center'>
                  <h1 className='text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent mb-2'>
                    Add Savings
                  </h1>
                  <p className='text-slate-600 dark:text-slate-400 text-base md:text-lg'>
                    Contribute to your savings account via Mobile Money
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className='max-w-2xl mx-auto mb-8'>
                <div className='flex items-center justify-center space-x-8'>
                  {paymentSteps.map((stepItem, index) => (
                    <div key={stepItem.id} className='flex items-center'>
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-300
                          ${
                            stepItem.completed
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                              : stepItem.current
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                                : 'bg-white/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                          }
                        `}
                      >
                        {stepItem.completed ? (
                          <CheckCircleIcon className='h-5 w-5' />
                        ) : (
                          stepItem.id
                        )}
                      </div>
                      {index < paymentSteps.length - 1 && (
                        <div className='w-16 sm:w-24 mx-2'>
                          <div
                            className={`
                              h-1 rounded-full transition-all duration-300
                              ${
                                stepItem.completed
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                  : 'bg-slate-200 dark:bg-slate-700'
                              }
                            `}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content */}
              <div className='max-w-4xl mx-auto'>
                {step === 'form' && (
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl'
                  >
                    <CardHeader
                      title='Payment Details'
                      subtitle='Enter the amount you want to add to your savings'
                      className='text-center'
                    />
                    <CardContent className='md:p-6'>
                      <form onSubmit={handleSubmit} className='space-y-6'>
                        {/* Amount Input */}
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Amount (GHS)
                          </label>
                          <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                              <CurrencyDollarIcon className='h-5 w-5 text-slate-400' />
                            </div>
                            <Input
                              type='number'
                              placeholder='0.00'
                              value={amount}
                              onChange={e => setAmount(e.target.value)}
                              className='pl-10 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                              error={errors.amount}
                              min='1'
                              max='10000'
                              step='0.01'
                            />
                          </div>
                          {amount && parseFloat(amount) > 0 && (
                            <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>
                              You are adding{' '}
                              {formatCurrency(parseFloat(amount))} to your
                              savings
                            </p>
                          )}
                        </div>

                        {/* Mobile Network Selection */}
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Select Mobile Network
                          </label>
                          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                            {mobileNetworks.map(network => (
                              <button
                                key={network.id}
                                type='button'
                                onClick={() => setSelectedNetwork(network.id)}
                                className={`
                                  relative p-4 rounded-xl border-2 transition-all duration-200 backdrop-blur-sm
                                  ${
                                    selectedNetwork === network.id
                                      ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-lg scale-105'
                                      : 'border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/30 hover:border-slate-300 dark:hover:border-slate-500 hover:scale-102'
                                  }
                                `}
                              >
                                <div className='flex items-center space-x-3'>
                                  <div className='w-12 h-12 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1'>
                                    <Image
                                      src={network.icon}
                                      width={40}
                                      height={40}
                                      alt={network.name}
                                      className='object-contain'
                                    />
                                  </div>
                                  <div className='text-left'>
                                    <p className='font-medium text-slate-900 dark:text-white text-sm'>
                                      {network.shortCode}
                                    </p>
                                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                                      {network.name}
                                    </p>
                                  </div>
                                </div>
                                {selectedNetwork === network.id && (
                                  <div className='absolute top-2 right-2'>
                                    <CheckCircleIcon className='h-5 w-5 text-primary' />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                          {errors.network && (
                            <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                              {errors.network}
                            </p>
                          )}
                        </div>

                        {/* Phone Number Input */}
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Mobile Money Number
                          </label>
                          <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                              <PhoneIcon className='h-5 w-5 text-slate-400' />
                            </div>
                            <Input
                              type='tel'
                              placeholder='0241234567'
                              value={phoneNumber}
                              onChange={e => setPhoneNumber(e.target.value)}
                              className='pl-10 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                              error={errors.phoneNumber}
                            />
                          </div>
                          <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                            Enter the phone number linked to your mobile money
                            account
                          </p>
                        </div>

                        {/* Security Notice */}
                        <div className='bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-4 backdrop-blur-sm'>
                          <div className='flex items-start space-x-3'>
                            <InformationCircleIcon className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5' />
                            <div>
                              <h4 className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                                Secure Payment
                              </h4>
                              <p className='text-sm text-blue-700 dark:text-blue-300 mt-1'>
                                Your payment is processed securely through
                                Paystack.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type='submit'
                          variant='primary'
                          size='lg'
                          className='w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl'
                          disabled={submitting}
                          icon={<PhoneIcon className='h-5 w-5' />}
                          iconPosition='left'
                          loading={submitting}
                        >
                          {submitting
                            ? 'Processing Payment...'
                            : 'Pay with Mobile Money'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {step === 'processing' && (
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl'
                  >
                    <CardContent className='p-6'>
                      <div className='text-center space-y-6'>
                        <div className='w-16 h-16 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto'>
                          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                        </div>

                        <div>
                          <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-2'>
                            Processing Your Payment
                          </h3>
                          <p className='text-slate-600 dark:text-slate-400'>
                            Please check your phone for a payment prompt and
                            authorize the transaction
                          </p>
                        </div>

                        <div className='bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-xl p-4 backdrop-blur-sm'>
                          <div className='flex items-center space-x-3'>
                            <PhoneIcon className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                            <div className='text-left'>
                              <p className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                                Authorization Required
                              </p>
                              <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                                Please check your phone for a payment prompt and
                                complete the authorization to proceed.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Payment Summary */}
                        <div className='bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm'>
                          <div className='text-sm space-y-2'>
                            <div className='flex justify-between'>
                              <span className='text-slate-600 dark:text-slate-400'>
                                Amount:
                              </span>
                              <span className='font-medium text-slate-900 dark:text-white'>
                                {formatCurrency(parseFloat(amount))}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-slate-600 dark:text-slate-400'>
                                Network:
                              </span>
                              <span className='font-medium text-slate-900 dark:text-white'>
                                {
                                  mobileNetworks.find(
                                    n => n.id === selectedNetwork
                                  )?.shortCode
                                }
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-slate-600 dark:text-slate-400'>
                                Phone:
                              </span>
                              <span className='font-medium text-slate-900 dark:text-white'>
                                {phoneNumber}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-slate-600 dark:text-slate-400'>
                                Reference:
                              </span>
                              <span className='font-medium text-slate-900 dark:text-white text-xs'>
                                {paymentReference}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 'success' && (
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl'
                  >
                    <CardContent className='p-6'>
                      <div className='text-center space-y-6'>
                        <div className='w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-full flex items-center justify-center mx-auto'>
                          <CheckCircleIcon className='h-10 w-10 text-green-600 dark:text-green-400' />
                        </div>

                        <div>
                          <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-2'>
                            Payment Successful!
                          </h3>
                          <p className='text-slate-600 dark:text-slate-400'>
                            Your savings contribution has been processed
                            successfully
                          </p>
                        </div>

                        <div className='bg-green-50/80 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 rounded-xl p-4 backdrop-blur-sm'>
                          <div className='text-sm space-y-2'>
                            <div className='flex justify-between'>
                              <span className='text-green-700 dark:text-green-300'>
                                Amount Added:
                              </span>
                              <span className='font-semibold text-green-800 dark:text-green-200'>
                                {formatCurrency(parseFloat(amount))}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-green-700 dark:text-green-300'>
                                Transaction ID:
                              </span>
                              <span className='font-medium text-green-800 dark:text-green-200 text-xs'>
                                {paymentReference}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-green-700 dark:text-green-300'>
                                Date:
                              </span>
                              <span className='font-medium text-green-800 dark:text-green-200'>
                                {new Date().toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className='space-y-3'>
                          <Button
                            variant='primary'
                            size='lg'
                            className='w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl'
                            onClick={handleBackToDashboard}
                          >
                            Back to Dashboard
                          </Button>
                          <Button
                            variant='outline'
                            size='lg'
                            className='w-full border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/30'
                            onClick={() => {
                              setStep('form');
                              setAmount('');
                              setSelectedNetwork('');
                              setPhoneNumber('');
                              setErrors({});
                              setPaymentReference('');
                            }}
                          >
                            Make Another Payment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 'error' && (
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl'
                  >
                    <CardContent className='p-6'>
                      <div className='text-center space-y-6'>
                        <div className='w-16 h-16 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto'>
                          <ExclamationTriangleIcon className='h-10 w-10 text-red-600 dark:text-red-400' />
                        </div>

                        <div>
                          <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-2'>
                            Payment Failed
                          </h3>
                          <p className='text-slate-600 dark:text-slate-400'>
                            Your payment could not be processed. Please try
                            again.
                          </p>
                        </div>

                        <div className='bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl p-4 backdrop-blur-sm'>
                          <div className='text-sm text-red-700 dark:text-red-300'>
                            <p className='font-medium mb-1'>
                              Possible reasons:
                            </p>
                            <ul className='list-disc list-inside space-y-1'>
                              <li>
                                Insufficient balance in your mobile money
                                account
                              </li>
                              <li>Transaction was declined or timed out</li>
                              <li>Network connectivity issues</li>
                              <li>
                                Mobile money service temporarily unavailable
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className='space-y-3'>
                          <Button
                            variant='primary'
                            size='lg'
                            className=' bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl'
                            onClick={handleRetry}
                          >
                            Try Again
                          </Button>
                          <Button
                            variant='outline'
                            size='lg'
                            className='w-full border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/30'
                            onClick={handleBackToDashboard}
                          >
                            Back to Dashboard
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Footer Information */}
              <div className='mt-12 text-center'>
                <div className='inline-flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span>Secure Payment Gateway</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <WifiIcon className='h-4 w-4' />
                    <span>Powered by Paystack</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <PhoneIcon className='h-4 w-4' />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </TeacherRoute>
  );
}
