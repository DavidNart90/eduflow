'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/auth-context-optimized';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  CalculatorIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  PercentBadgeIcon,
  ClockIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface TeacherInterest {
  teacher_id: string;
  teacher_name: string;
  employee_id: string;
  current_balance: number;
  calculated_interest: number;
  new_balance: number;
}

interface InterestCalculation {
  eligible_teachers: TeacherInterest[];
  total_eligible_balance: number;
  total_interest_to_pay: number;
  eligible_teachers_count: number;
  interest_rate: number;
  current_quarter: string;
  current_year: number;
  calculation_date: string;
}

interface InterestSettings {
  interest_rate: number;
  payment_frequency: string;
  current_quarter: string;
  current_year: number;
  is_active: boolean;
  last_updated: string | null;
}

interface PaymentHistoryItem {
  id: string;
  payment_period: string;
  payment_year: number;
  payment_quarter: number | null;
  interest_rate: number;
  total_eligible_balance: number;
  total_interest_paid: number;
  eligible_teachers_count: number;
  payment_status: string;
  execution_date: string | null;
  executed_by_name: string | null;
}

export default function QuarterlyInterestPage() {
  const router = useRouter();
  const { validateSession } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add ref to prevent multiple simultaneous calls
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const [interestSettings, setInterestSettings] =
    useState<InterestSettings | null>(null);
  const [interestCalculation, setInterestCalculation] =
    useState<InterestCalculation | null>(null);
  const [currentQuarterPaid, setCurrentQuarterPaid] = useState(false);
  const [, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);

  // Fetch initial data
  const fetchInterestData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current || !mountedRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Validate session before making API call
      const isSessionValid = await validateSession();
      if (!isSessionValid) {
        setError('Session expired. Please refresh the page or log in again.');
        return;
      }

      // Get the current session token
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        setError(
          'Authentication required. Please refresh the page or log in again.'
        );
        return;
      }

      const response = await fetch('/api/admin/quarterly-interest', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch interest data');
      }

      const data = await response.json();

      if (data.success) {
        setInterestSettings(data.settings);
        setCurrentQuarterPaid(data.current_quarter_paid);
        setPaymentHistory(data.payment_history);
      } else {
        throw new Error(data.error || 'Failed to fetch interest data');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load interest data';
      setError(errorMessage);
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [validateSession]); // Include validateSession as dependency

  useEffect(() => {
    // Set mounted to true and fetch data once on mount
    mountedRef.current = true;
    fetchInterestData();

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount, ignore fetchInterestData to prevent loops

  const handleRunCalculation = async () => {
    try {
      setIsCalculating(true);
      setError(null);

      // Validate session before making API call
      const isSessionValid = await validateSession();
      if (!isSessionValid) {
        setError('Session expired. Please refresh the page or log in again.');
        return;
      }

      // Get the current session token
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        setError(
          'Authentication required. Please refresh the page or log in again.'
        );
        return;
      }

      const response = await fetch(
        '/api/admin/quarterly-interest?action=calculate',
        {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate interest');
      }

      const data = await response.json();

      if (data.success) {
        setInterestCalculation(data.calculation);
        setSuccess('Interest calculation completed successfully!');
      } else {
        throw new Error(data.error || 'Failed to calculate interest');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to calculate interest';
      setError(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExecutePayment = async () => {
    if (!interestCalculation) return;

    try {
      setIsExecuting(true);
      setError(null);

      // Validate session before making API call
      const isSessionValid = await validateSession();
      if (!isSessionValid) {
        setError('Session expired. Please refresh the page or log in again.');
        return;
      }

      // Get the current session token
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        setError(
          'Authentication required. Please refresh the page or log in again.'
        );
        return;
      }

      const response = await fetch('/api/admin/quarterly-interest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'execute_payment',
          payment_period: `${interestCalculation.current_quarter}-${interestCalculation.current_year}`,
          payment_year: interestCalculation.current_year,
          payment_quarter: parseInt(
            interestCalculation.current_quarter.replace('Q', '')
          ),
          notes: `Quarterly interest payment for ${interestCalculation.current_quarter} ${interestCalculation.current_year}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to execute interest payment'
        );
      }

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `Interest payment executed successfully! Payment ID: ${data.payment_id}`
        );
        setShowConfirmation(false);
        setCurrentQuarterPaid(true);
        // Refresh data
        fetchInterestData();
      } else {
        throw new Error(data.error || 'Failed to execute interest payment');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to execute interest payment';
      setError(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(2);
  };

  // Get quarter period text
  const getQuarterPeriod = (quarter: string, year: number) => {
    const quarterMap: { [key: string]: string } = {
      Q1: 'Jan 1 - Mar 31',
      Q2: 'Apr 1 - Jun 30',
      Q3: 'Jul 1 - Sep 30',
      Q4: 'Oct 1 - Dec 31',
    };
    return `${quarterMap[quarter] || 'N/A'}, ${year}`;
  };

  return (
    <AdminRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {isLoading ? (
            <>
              {/* Loading Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='lg:w-full'>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={400}
                      height={48}
                      animation='pulse'
                      className='mx-auto lg:mx-auto mb-3 rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={350}
                      height={24}
                      animation='pulse'
                      className='mx-auto lg:mx-auto mb-2 rounded-lg'
                    />
                  </div>
                  <MuiSkeletonComponent
                    variant='rectangular'
                    width={80}
                    height={32}
                    animation='pulse'
                    className='self-start sm:self-auto rounded-full'
                  />
                </div>
              </div>

              {/* Loading cards */}
              <div className='max-w-6xl mx-auto space-y-6'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card
                    key={i}
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                  >
                    <CardContent className='p-6 md:p-8'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={'100%'}
                        height={200}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='lg:w-full'>
                    <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-green-900 to-slate-900 dark:from-white dark:via-green-200 dark:to-white bg-clip-text text-transparent'>
                      Quarterly Interest Payment System
                    </h1>
                    <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                      Calculate and apply interest to teacher savings balances
                    </p>
                  </div>
                  <Badge
                    variant='primary'
                    className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
                  >
                    Admin
                  </Badge>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className='max-w-6xl mx-auto mb-6'>
                  <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                    <div className='flex items-center gap-2'>
                      <ExclamationTriangleIcon className='h-5 w-5 text-red-600 dark:text-red-400' />
                      <p className='text-red-800 dark:text-red-200'>{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className='max-w-6xl mx-auto mb-6'>
                  <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4'>
                    <div className='flex items-center gap-2'>
                      <CheckCircleIcon className='h-5 w-5 text-green-600 dark:text-green-400' />
                      <p className='text-green-800 dark:text-green-200'>
                        {success}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className='max-w-6xl mx-auto'>
                {/* Current Quarter Status */}
                {currentQuarterPaid && (
                  <Card
                    variant='glass'
                    className='border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 mb-6'
                  >
                    <CardContent className='p-6 md:p-8'>
                      <div className='flex items-center gap-3'>
                        <CheckCircleIcon className='h-6 w-6 text-green-600 dark:text-green-400' />
                        <div>
                          <h3 className='text-lg font-semibold text-green-900 dark:text-green-100'>
                            Interest Already Paid This Quarter
                          </h3>
                          <p className='text-green-700 dark:text-green-300'>
                            Interest for {interestSettings?.current_quarter}{' '}
                            {interestSettings?.current_year} has already been
                            processed.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Interest Payment Information */}
                {interestSettings && (
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                  >
                    <CardContent className='p-6 md:p-8'>
                      <div className='flex items-center gap-3 mb-6'>
                        <div className='w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center'>
                          <InformationCircleIcon className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                        </div>
                        <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
                          Interest Payment Information
                        </h2>
                      </div>

                      <p className='text-slate-600 dark:text-slate-400 mb-6 leading-relaxed'>
                        This tool calculates and applies interest to teacher
                        savings balances based on the Association&apos;s
                        approved interest formula. Interest is paid{' '}
                        {interestSettings.payment_frequency} based on the
                        current interest rate.
                      </p>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        {/* Current Quarter */}
                        <div className='text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'>
                          <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-3'>
                            <CalendarDaysIcon className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                          </div>
                          <div className='text-sm text-blue-700 dark:text-blue-300 font-medium mb-1'>
                            Current Quarter
                          </div>
                          <div className='text-xl font-bold text-blue-900 dark:text-blue-100'>
                            {interestSettings.current_quarter}{' '}
                            {interestSettings.current_year}
                          </div>
                        </div>

                        {/* Interest Rate */}
                        <div className='text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'>
                          <div className='w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3'>
                            <PercentBadgeIcon className='h-6 w-6 text-green-600 dark:text-green-400' />
                          </div>
                          <div className='text-sm text-green-700 dark:text-green-300 font-medium mb-1'>
                            Interest Rate
                          </div>
                          <div className='text-xl font-bold text-green-900 dark:text-green-100'>
                            {formatPercentage(interestSettings.interest_rate)}%
                          </div>
                        </div>

                        {/* Interest Period */}
                        <div className='text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'>
                          <div className='w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-3'>
                            <ClockIcon className='h-6 w-6 text-purple-600 dark:text-purple-400' />
                          </div>
                          <div className='text-sm text-purple-700 dark:text-purple-300 font-medium mb-1'>
                            Interest Period
                          </div>
                          <div className='text-lg font-bold text-purple-900 dark:text-purple-100'>
                            {getQuarterPeriod(
                              interestSettings.current_quarter,
                              interestSettings.current_year
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Interest Calculation Preview */}
                {!currentQuarterPaid && (
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                  >
                    <CardContent className='p-6 md:p-8'>
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
                        <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
                          Interest Calculation Preview
                        </h2>
                        <Button
                          variant='outline'
                          onClick={handleRunCalculation}
                          disabled={isCalculating}
                          className='!text-primary !border-primary/20 hover:!bg-primary/10'
                          icon={
                            isCalculating ? (
                              <ClockIcon className='h-4 w-4 animate-spin' />
                            ) : (
                              <CalculatorIcon className='h-4 w-4' />
                            )
                          }
                        >
                          {isCalculating
                            ? 'Calculating...'
                            : 'Run Interest Calculation'}
                        </Button>
                      </div>

                      {interestCalculation ? (
                        <>
                          {/* Table */}
                          <div className='overflow-x-auto'>
                            <table className='w-full'>
                              <thead>
                                <tr className='border-b border-slate-200 dark:border-slate-700'>
                                  <th className='text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                                    Teacher Name
                                  </th>
                                  <th className='text-right py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                                    Current Balance
                                  </th>
                                  <th className='text-right py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                                    Calculated Interest
                                  </th>
                                  <th className='text-right py-3 px-4 font-medium text-slate-700 dark:text-slate-300'>
                                    New Balance
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {interestCalculation.eligible_teachers
                                  .slice(0, 10)
                                  .map(teacher => (
                                    <tr
                                      key={teacher.teacher_id}
                                      className='border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    >
                                      <td className='py-3 px-4 text-slate-900 dark:text-white font-medium'>
                                        {teacher.teacher_name}
                                      </td>
                                      <td className='py-3 px-4 text-right text-slate-600 dark:text-slate-400'>
                                        {formatCurrency(
                                          teacher.current_balance
                                        )}
                                      </td>
                                      <td className='py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400'>
                                        {formatCurrency(
                                          teacher.calculated_interest
                                        )}
                                      </td>
                                      <td className='py-3 px-4 text-right font-bold text-slate-900 dark:text-white'>
                                        {formatCurrency(teacher.new_balance)}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>

                          {interestCalculation.eligible_teachers.length >
                            10 && (
                            <p className='text-sm text-slate-500 dark:text-slate-400 mt-4 text-center'>
                              Showing first 10 teachers. Total:{' '}
                              {interestCalculation.eligible_teachers_count}{' '}
                              eligible teachers.
                            </p>
                          )}

                          {/* Total Summary */}
                          <div className='border-t border-slate-200 dark:border-slate-700 pt-4 mt-4'>
                            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                              <div className='text-sm text-slate-600 dark:text-slate-400'>
                                <span className='font-medium'>
                                  Total Interest to be Paid:
                                </span>
                                <br />
                                <span>
                                  {interestCalculation.eligible_teachers_count}{' '}
                                  eligible teachers
                                </span>
                              </div>
                              <div className='text-right'>
                                <div className='text-2xl font-bold text-primary'>
                                  {formatCurrency(
                                    interestCalculation.total_interest_to_pay
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className='text-center py-8'>
                          <p className='text-slate-500 dark:text-slate-400'>
                            Click &ldquo;Run Interest Calculation&rdquo; to
                            preview the interest payment for all eligible
                            teachers.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Execute Interest Payment */}
                {!currentQuarterPaid && interestCalculation && (
                  <Card
                    variant='glass'
                    className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                  >
                    <CardContent className='p-6 md:p-8'>
                      <h2 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>
                        Execute Interest Payment
                      </h2>

                      <p className='text-slate-600 dark:text-slate-400 mb-2'>
                        Ready to apply interest for{' '}
                        {interestCalculation.current_quarter}{' '}
                        {interestCalculation.current_year} to{' '}
                        {interestCalculation.eligible_teachers_count} eligible
                        teachers
                      </p>
                      <p className='text-sm text-slate-500 dark:text-slate-500 mb-6'>
                        This action will update all teacher balances and cannot
                        be reversed.
                      </p>

                      <div className='flex gap-4'>
                        <Button
                          variant='primary'
                          onClick={() => setShowConfirmation(true)}
                          disabled={isExecuting}
                          className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg'
                          icon={
                            isExecuting ? (
                              <ClockIcon className='h-5 w-5 animate-spin' />
                            ) : (
                              <CreditCardIcon className='h-5 w-5' />
                            )
                          }
                        >
                          {isExecuting
                            ? 'Processing Payment...'
                            : 'Execute Interest Payment'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Confirmation Modal */}
                {showConfirmation && interestCalculation && (
                  <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                    <Card className='w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl'>
                      <CardContent className='p-6 md:p-8'>
                        <div className='flex items-center gap-3 mb-4'>
                          <div className='w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center'>
                            <ExclamationTriangleIcon className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
                          </div>
                          <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                            Confirm Interest Payment
                          </h3>
                        </div>

                        <div className='mb-6 space-y-2'>
                          <p className='text-slate-600 dark:text-slate-400'>
                            Are you sure you want to execute the interest
                            payment for {interestCalculation.current_quarter}{' '}
                            {interestCalculation.current_year}?
                          </p>
                          <div className='bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-1'>
                            <p className='text-sm'>
                              <strong>Eligible Teachers:</strong>{' '}
                              {interestCalculation.eligible_teachers_count}
                            </p>
                            <p className='text-sm'>
                              <strong>Total Interest:</strong>{' '}
                              {formatCurrency(
                                interestCalculation.total_interest_to_pay
                              )}
                            </p>
                            <p className='text-sm'>
                              <strong>Interest Rate:</strong>{' '}
                              {formatPercentage(
                                interestCalculation.interest_rate
                              )}
                              %
                            </p>
                          </div>
                          <p className='text-sm text-red-600 dark:text-red-400'>
                            This action cannot be undone.
                          </p>
                        </div>

                        <div className='flex gap-3 justify-end'>
                          <Button
                            variant='outline'
                            onClick={() => setShowConfirmation(false)}
                            disabled={isExecuting}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant='primary'
                            onClick={handleExecutePayment}
                            disabled={isExecuting}
                            className='bg-gradient-to-r from-green-600 to-emerald-600'
                            icon={
                              isExecuting ? (
                                <ClockIcon className='h-4 w-4 animate-spin' />
                              ) : (
                                <PlayIcon className='h-4 w-4' />
                              )
                            }
                          >
                            {isExecuting
                              ? 'Executing...'
                              : 'Yes, Execute Payment'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-6 mt-6'>
                  <Button
                    variant='ghost'
                    onClick={() => router.push('/admin/dashboard')}
                    className='text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-white'
                    icon={<ArrowLeftIcon className='h-4 w-4' />}
                  >
                    Back to Dashboard
                  </Button>

                  <div className='flex space-x-4'>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/admin/interest-settings')}
                      className='text-primary hover:text-purple-600 hover:bg-primary/50'
                    >
                      Interest Settings
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/admin/savings-history')}
                      className='text-primary hover:text-purple-600 hover:bg-primary/10'
                    >
                      View History
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </AdminRoute>
  );
}
