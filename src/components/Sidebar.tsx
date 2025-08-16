'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-optimized';
import { Button } from '@/components/ui';
import {
  XMarkIcon,
  HomeIcon,
  ClockIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
  EnvelopeIcon,
  PlusIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Admin navigation
  const adminNavigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    {
      name: 'Upload Controller Report',
      href: '/admin/upload-controller-report',
      icon: DocumentArrowUpIcon,
    },
    {
      name: 'Generate Quarterly Reports',
      href: '/admin/generate-quarterly-reports',
      icon: ChartBarIcon,
    },
    {
      name: 'Trigger Quarterly Interest',
      href: '/admin/quarterly-interest',
      icon: CreditCardIcon,
    },
    { name: 'Manage Teachers', href: '/admin/teachers', icon: UsersIcon },
    { name: 'Email Log', href: '/admin/email-log', icon: EnvelopeIcon },
    { name: 'Account Settings', href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  // Teacher navigation
  const teacherNavigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/teacher/dashboard', icon: HomeIcon },
    { name: 'Add Savings', href: '/teacher/add-savings', icon: PlusIcon },
    {
      name: 'Savings History',
      href: '/teacher/savings-history',
      icon: ClockIcon,
    },
    { name: 'Statements', href: '/teacher/statements', icon: DocumentTextIcon },
    {
      name: 'Account Settings',
      href: '/teacher/settings',
      icon: Cog6ToothIcon,
    },
  ];

  const navigation =
    user.role === 'admin' ? adminNavigation : teacherNavigation;

  const isCurrentPage = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Error occurred during sign out
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900  shadow-md dark:shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-0
        `}
      >
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 justify-center'>
                <svg
                  className='h-10 w-10'
                  fill='url(#logoGradient)'
                  stroke='none'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <defs>
                    <linearGradient
                      id='logoGradient'
                      x1='0%'
                      y1='0%'
                      x2='100%'
                      y2='100%'
                    >
                      <stop offset='0%' stopColor='#4323fc' />
                      <stop offset='100%' stopColor='#667eea' />
                    </linearGradient>
                  </defs>
                  <path d='M12 14l9-5-9-5-9 5 9 5z' />
                  <path d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' />
                  <path d='M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' />
                </svg>
              </div>
              <div>
                <h1 className='text-lg font-semibold text-gray-900 dark:text-white mt-2'>
                  Eduflow
                </h1>
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='lg:hidden hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20'
            >
              <XMarkIcon className='h-5 w-5' />
            </Button>
          </div>

          {/* Navigation */}
          <nav className='flex-1 px-4 py-6 space-y-2 overflow-y-auto'>
            {navigation.map(item => {
              const current = isCurrentPage(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group relative flex items-center px-4 py-3 text-sm font-medium rounded-lg  transition-all duration-200
                    ${
                      current
                        ? 'bg-primary/10 text-primary border-l-4  border-primary dark:bg-primary/20 dark:text-primary-foreground shadow-sm'
                        : 'text-gray-700 hover:bg-primary/5 hover:text-primary hover:border-primary/30 dark:text-gray-300 dark:hover:bg-primary/10 dark:hover:text-primary-foreground border-l-4 border-transparent'
                    }
                  `}
                  onClick={onClose}
                >
                  <item.icon
                    className={`h-5 w-5 mr-3 transition-colors duration-200 ${
                      current
                        ? 'text-primary dark:text-primary-foreground'
                        : 'text-gray-500 group-hover:text-primary dark:text-gray-400 dark:group-hover:text-primary-foreground'
                    }`}
                  />
                  <span className='font-medium'>{item.name}</span>
                  {current && (
                    <div className='absolute right-3 w-2 h-2 bg-primary rounded-full dark:bg-primary-foreground shadow-sm'></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className='p-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0'>
            <div className='flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-gray-100 dark:border-gray-800 mb-3'>
              <div className='w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-sm'>
                <span className='gradient-text font-medium '>
                  {getInitials(user.full_name)}
                </span>
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                  {user.full_name}
                </p>
                <p className='text-xs text-gray-500 dark:text-primary-foreground/80 truncate font-medium'>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={handleSignOut}
              className='w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-all duration-200 inline-flex items-center'
            >
              <ArrowRightOnRectangleIcon className='h-5 w-5 mr-3' />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
