'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { MuiSkeletonComponent } from '@/components/ui/Skeleton';
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
} from '@heroicons/react/24/outline';

interface TeacherInterest {
  id: string;
  teacherName: string;
  currentBalance: number;
  calculatedInterest: number;
  newBalance: number;
}

interface InterestSettings {
  currentQuarter: string;
  interestRate: number;
  interestPeriod: string;
  totalTeachers: number;
  totalInterestToPay: number;
}

export default function QuarterlyInterestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Sample data - replace with real data later
  const [interestSettings] = useState<InterestSettings>({
    currentQuarter: 'Q2 2025',
    interestRate: 4.25,
    interestPeriod: 'Jan 1 - Jun 30, 2025',
    totalTeachers: 102,
    totalInterestToPay: 3842.67,
  });

  const [teacherInterestData] = useState<TeacherInterest[]>([
    {
      id: '1',
      teacherName: 'Sarah Mensah',
      currentBalance: 2450.0,
      calculatedInterest: 104.13,
      newBalance: 2554.13,
    },
    {
      id: '2',
      teacherName: 'John Asante',
      currentBalance: 1890.0,
      calculatedInterest: 80.33,
      newBalance: 1970.33,
    },
    {
      id: '3',
      teacherName: 'Mary Osei',
      currentBalance: 3200.0,
      calculatedInterest: 136.0,
      newBalance: 3336.0,
    },
    {
      id: '4',
      teacherName: 'Emmanuel Boateng',
      currentBalance: 1750.0,
      calculatedInterest: 74.38,
      newBalance: 1824.38,
    },
    {
      id: '5',
      teacherName: 'Grace Addo',
      currentBalance: 2890.0,
      calculatedInterest: 122.83,
      newBalance: 3012.83,
    },
  ]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleRunCalculation = () => {
    setIsCalculating(true);
    // Simulate calculation
    setTimeout(() => {
      setIsCalculating(false);
    }, 3000);
  };

  const handleExecutePayment = () => {
    setIsExecuting(true);
    // Simulate payment execution
    setTimeout(() => {
      setIsExecuting(false);
      setShowConfirmation(false);
    }, 5000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
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

              {/* Loading Interest Information */}
              <div className='max-w-6xl mx-auto mb-6'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6 md:p-8'>
                    <div className='flex items-center gap-3 mb-6'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={24}
                        height={24}
                        animation='pulse'
                        className='rounded-full'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={200}
                        height={24}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={'100%'}
                      height={20}
                      animation='pulse'
                      className='mb-6 rounded-lg'
                    />

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className='text-center p-4'>
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={40}
                            height={40}
                            animation='pulse'
                            className='mx-auto mb-3 rounded-full'
                          />
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={80}
                            height={16}
                            animation='pulse'
                            className='mx-auto mb-2 rounded-lg'
                          />
                          <MuiSkeletonComponent
                            variant='rectangular'
                            width={100}
                            height={24}
                            animation='pulse'
                            className='mx-auto rounded-lg'
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Loading Interest Calculation Preview */}
              <div className='max-w-6xl mx-auto mb-6'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6 md:p-8'>
                    <div className='flex justify-between items-center mb-6'>
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={250}
                        height={24}
                        animation='pulse'
                        className='rounded-lg'
                      />
                      <MuiSkeletonComponent
                        variant='rectangular'
                        width={180}
                        height={40}
                        animation='pulse'
                        className='rounded-lg'
                      />
                    </div>

                    {/* Table Headers */}
                    <div className='grid grid-cols-4 gap-4 mb-4'>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <MuiSkeletonComponent
                          key={i}
                          variant='rectangular'
                          width={'100%'}
                          height={20}
                          animation='pulse'
                          className='rounded-lg'
                        />
                      ))}
                    </div>

                    {/* Table Rows */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className='grid grid-cols-4 gap-4 mb-4'>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <MuiSkeletonComponent
                            key={j}
                            variant='rectangular'
                            width={'100%'}
                            height={24}
                            animation='pulse'
                            className='rounded-lg'
                          />
                        ))}
                      </div>
                    ))}

                    {/* Total */}
                    <div className='border-t pt-4 mt-4'>
                      <div className='flex justify-between items-center'>
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={150}
                          height={20}
                          animation='pulse'
                          className='rounded-lg'
                        />
                        <MuiSkeletonComponent
                          variant='rectangular'
                          width={100}
                          height={28}
                          animation='pulse'
                          className='rounded-lg'
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Loading Execute Payment */}
              <div className='max-w-6xl mx-auto'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-6 md:p-8'>
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={200}
                      height={24}
                      animation='pulse'
                      className='mb-4 rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={'100%'}
                      height={20}
                      animation='pulse'
                      className='mb-2 rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={'80%'}
                      height={16}
                      animation='pulse'
                      className='mb-6 rounded-lg'
                    />
                    <MuiSkeletonComponent
                      variant='rectangular'
                      width={180}
                      height={48}
                      animation='pulse'
                      className='rounded-xl'
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='lg:w-full'>
                    <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-green-900 to-slate-900 dark:from-white dark:via-green-200 dark:to-white bg-clip-text text-transparent'>
                      Trigger Quarterly Interest Payment
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

              {/* Main Content */}
              <div className='max-w-6xl mx-auto'>
                {/* Interest Payment Information */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-1 md:p-8'>
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
                      savings balances based on the Association&apos;s approved
                      interest formula. Interest is paid semi-annually at the
                      end of the second and fourth quarters.
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
                          {interestSettings.currentQuarter}
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
                          {interestSettings.interestRate}%
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
                          {interestSettings.interestPeriod}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Interest Calculation Preview */}
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80 mb-6'
                >
                  <CardContent className='p-2 md:p-8'>
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
                          {teacherInterestData.map(teacher => (
                            <tr
                              key={teacher.id}
                              className='border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            >
                              <td className='py-3 px-4 text-slate-900 dark:text-white font-medium'>
                                {teacher.teacherName}
                              </td>
                              <td className='py-3 px-4 text-right text-slate-600 dark:text-slate-400'>
                                {formatCurrency(teacher.currentBalance)}
                              </td>
                              <td className='py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400'>
                                {formatCurrency(teacher.calculatedInterest)}
                              </td>
                              <td className='py-3 px-4 text-right font-bold text-slate-900 dark:text-white'>
                                {formatCurrency(teacher.newBalance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Summary */}
                    <div className='border-t border-slate-200 dark:border-slate-700 pt-4 mt-4'>
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div className='text-sm text-slate-600 dark:text-slate-400'>
                          <span className='font-medium'>
                            Total Interest to be Paid:
                          </span>
                          <br />
                          <span>
                            Showing preview for {interestSettings.totalTeachers}{' '}
                            teachers
                          </span>
                        </div>
                        <div className='text-right'>
                          <div className='text-2xl font-bold text-primary'>
                            {formatCurrency(
                              interestSettings.totalInterestToPay
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Execute Interest Payment */}
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
                      {interestSettings.currentQuarter} to all active teachers
                    </p>
                    <p className='text-sm text-slate-500 dark:text-slate-500 mb-6'>
                      This action will update all teacher balances and cannot be
                      reversed.
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
                          : 'Run Interest Calculation'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Confirmation Modal */}
                {showConfirmation && (
                  <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                    <Card className='w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl'>
                      <CardContent className='p-2 md:p-8'>
                        <div className='flex items-center gap-3 mb-4'>
                          <div className='w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center'>
                            <ExclamationTriangleIcon className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
                          </div>
                          <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                            Confirm Interest Payment
                          </h3>
                        </div>

                        <p className='text-slate-600 dark:text-slate-400 mb-6'>
                          Are you sure you want to execute the interest payment
                          for {interestSettings.currentQuarter}? This will
                          update all teacher balances and cannot be undone.
                        </p>

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
                    className='text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    icon={<ArrowLeftIcon className='h-4 w-4' />}
                  >
                    Back to Dashboard
                  </Button>

                  <div className='flex space-x-4'>
                    <Button
                      variant='outline'
                      onClick={() =>
                        router.push('/admin/generate-quarterly-reports')
                      }
                      className='text-primary hover:bg-primary/10'
                    >
                      Generate Reports
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/admin/settings')}
                      className='text-primary hover:bg-primary/10'
                    >
                      Account Settings
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
