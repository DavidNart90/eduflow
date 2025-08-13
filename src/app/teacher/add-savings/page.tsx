'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui';
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
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>(
    'form'
  );
  const [amount, setAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentReference, setPaymentReference] = useState('');

  // Check if user is actually a teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Mobile networks data
  const mobileNetworks: MobileNetwork[] = [
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      shortCode: 'MTN',
      color: 'bg-yellow-500',
      icon: '📱',
    },
    {
      id: 'vodafone',
      name: 'Vodafone Cash',
      shortCode: 'VOD',
      color: 'bg-red-500',
      icon: '💰',
    },
    {
      id: 'airteltigo',
      name: 'AirtelTigo Money',
      shortCode: 'ATL',
      color: 'bg-blue-500',
      icon: '💳',
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
      return;
    }

    setSubmitting(true);
    setStep('processing');

    try {
      // Generate payment reference
      const reference = `SAVE_${Date.now()}_${user?.employee_id || 'USER'}`;
      setPaymentReference(reference);

      // Simulate payment processing (replace with actual Flutterwave integration)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // For demo purposes, randomly succeed or fail
      const success = Math.random() > 0.2; // 80% success rate

      if (success) {
        setStep('success');

        // In a real implementation, you would:
        // 1. Call Flutterwave API to initialize payment
        // 2. Handle the response
        // 3. Update the database with transaction details
      } else {
        setStep('error');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Payment error:', error);
      setStep('error');
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

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    router.push('/teacher/dashboard');
  };

  // Early return if user is not a teacher
  if (user && user.role !== 'teacher') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Access Denied
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            This page is only accessible to teachers.
          </p>
          <Button variant='primary' onClick={() => router.push('/auth/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TeacherRoute>
      <Layout>
        <div className='p-6'>
          {/* Header */}
          <div className='mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white text-center '>
                Add Savings
              </h1>
              <p className='text-gray-600 dark:text-gray-400 mt-2  text-center'>
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
                      w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                      ${
                        stepItem.completed
                          ? 'bg-green-500 text-white'
                          : stepItem.current
                            ? ' bg-primary-solid text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
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
                          h-1 rounded-full
                          ${
                            stepItem.completed
                              ? 'bg-green-500'
                              : 'bg-gray-200 dark:bg-gray-700'
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
              <Card variant='glass'>
                <CardHeader
                  title='Payment Details'
                  subtitle='Enter the amount you want to add to your savings'
                />
                <CardContent className='md:p-6 '>
                  <form onSubmit={handleSubmit} className='space-y-6'>
                    {/* Amount Input */}
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Amount (GHS)
                      </label>
                      <div className='relative'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                          <CurrencyDollarIcon className='h-5 w-5 text-gray-400' />
                        </div>
                        <Input
                          type='number'
                          placeholder='0.00'
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          className='pl-10'
                          error={errors.amount}
                          min='1'
                          max='10000'
                          step='0.01'
                        />
                      </div>
                      {amount && parseFloat(amount) > 0 && (
                        <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                          You are adding {formatCurrency(parseFloat(amount))} to
                          your savings
                        </p>
                      )}
                    </div>

                    {/* Mobile Network Selection */}
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Select Mobile Network
                      </label>
                      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                        {mobileNetworks.map(network => (
                          <button
                            key={network.id}
                            type='button'
                            onClick={() => setSelectedNetwork(network.id)}
                            className={`
                              relative p-4 rounded-lg border-2 transition-all duration-200
                              ${
                                selectedNetwork === network.id
                                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }
                            `}
                          >
                            <div className='flex items-center space-x-3'>
                              <div
                                className={`w-10 h-10 ${network.color} rounded-lg flex items-center justify-center text-white text-lg`}
                              >
                                {network.icon}
                              </div>
                              <div className='text-left'>
                                <p className='font-medium text-gray-900 dark:text-white text-sm'>
                                  {network.shortCode}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
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
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Mobile Money Number
                      </label>
                      <div className='relative'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                          <PhoneIcon className='h-5 w-5 text-gray-400' />
                        </div>
                        <Input
                          type='tel'
                          placeholder='0241234567'
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value)}
                          className='pl-10'
                          error={errors.phoneNumber}
                        />
                      </div>
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                        Enter the phone number linked to your mobile money
                        account
                      </p>
                    </div>

                    {/* Security Notice */}
                    <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
                      <div className='flex items-start space-x-3'>
                        <InformationCircleIcon className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5' />
                        <div>
                          <h4 className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                            Secure Payment
                          </h4>
                          <p className='text-sm text-blue-700 dark:text-blue-300 mt-1'>
                            Your payment is processed securely through
                            Flutterwave.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type='submit'
                      variant='primary'
                      size='lg'
                      className='w-full'
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
              <Card variant='glass'>
                <CardContent className='p-6'>
                  <div className='text-center space-y-6'>
                    <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                        Processing Your Payment
                      </h3>
                      <p className='text-gray-600 dark:text-gray-400'>
                        Please check your phone for a payment prompt and
                        authorize the transaction
                      </p>
                    </div>

                    <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
                      <div className='flex items-center space-x-3'>
                        <PhoneIcon className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                        <div className='text-left'>
                          <p className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                            Authorization Required
                          </p>
                          <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                            Dial the USSD code or check your mobile money app to
                            complete the payment
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4'>
                      <div className='text-sm space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Amount:
                          </span>
                          <span className='font-medium text-gray-900 dark:text-white'>
                            {formatCurrency(parseFloat(amount))}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Network:
                          </span>
                          <span className='font-medium text-gray-900 dark:text-white'>
                            {
                              mobileNetworks.find(n => n.id === selectedNetwork)
                                ?.shortCode
                            }
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Phone:
                          </span>
                          <span className='font-medium text-gray-900 dark:text-white'>
                            {phoneNumber}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Reference:
                          </span>
                          <span className='font-medium text-gray-900 dark:text-white text-xs'>
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
              <Card variant='glass'>
                <CardContent className='p-6'>
                  <div className='text-center space-y-6'>
                    <div className='w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto'>
                      <CheckCircleIcon className='h-10 w-10 text-green-600 dark:text-green-400' />
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                        Payment Successful!
                      </h3>
                      <p className='text-gray-600 dark:text-gray-400'>
                        Your savings contribution has been processed
                        successfully
                      </p>
                    </div>

                    <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4'>
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
                        className='w-full'
                        onClick={handleBackToDashboard}
                      >
                        Back to Dashboard
                      </Button>
                      <Button
                        variant='outline'
                        size='lg'
                        className='w-full'
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
              <Card variant='glass'>
                <CardContent className='p-6'>
                  <div className='text-center space-y-6'>
                    <div className='w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto'>
                      <ExclamationTriangleIcon className='h-10 w-10 text-red-600 dark:text-red-400' />
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                        Payment Failed
                      </h3>
                      <p className='text-gray-600 dark:text-gray-400'>
                        Your payment could not be processed. Please try again.
                      </p>
                    </div>

                    <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                      <div className='text-sm text-red-700 dark:text-red-300'>
                        <p className='font-medium mb-1'>Possible reasons:</p>
                        <ul className='list-disc list-inside space-y-1'>
                          <li>
                            Insufficient balance in your mobile money account
                          </li>
                          <li>Transaction was declined or timed out</li>
                          <li>Network connectivity issues</li>
                          <li>Mobile money service temporarily unavailable</li>
                        </ul>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <Button
                        variant='primary'
                        size='lg'
                        className='w-full'
                        onClick={handleRetry}
                      >
                        Try Again
                      </Button>
                      <Button
                        variant='outline'
                        size='lg'
                        className='w-full'
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
            <div className='inline-flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400'>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <span>Secure Payment Gateway</span>
              </div>
              <div className='flex items-center space-x-2'>
                <WifiIcon className='h-4 w-4' />
                <span>Powered by Flutterwave</span>
              </div>
              <div className='flex items-center space-x-2'>
                <PhoneIcon className='h-4 w-4' />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </TeacherRoute>
  );
}
