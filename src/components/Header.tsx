'use client';

import { useAuth } from '@/lib/auth-context-simple';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import Link from 'next/link';

import {
  Bars3Icon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

  const getRoleDisplayName = (role: string) => {
    return role === 'admin' ? 'Admin' : 'Teacher';
  };

  if (!user) return null;

  return (
    <header className='bg-white dark:bg-gray-900  shadow-sm dark:shadow-lg'>
      <div className='flex items-center justify-between px-4 py-5'>
        {/* Left side - Mobile menu button and title */}
        <div className='flex items-center space-x-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onMenuToggle}
            className='lg:hidden hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20'
          >
            <Bars3Icon className='h-6 w-6' />
          </Button>

          <div className='hidden md:block'>
            <div className='flex items-center space-x-3'>
              <h1 className='text-xl font-semibold gradient-text'>
                {getRoleDisplayName(user.role)} Dashboard
              </h1>
              <Badge variant='primary'>{getRoleDisplayName(user.role)}</Badge>
            </div>
          </div>
        </div>

        {/* Right side - Actions and profile */}
        <div className='flex items-center space-x-3'>
          {/* Theme toggle */}
          <Button
            variant='ghost'
            size='sm'
            onClick={toggleTheme}
            className='relative hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-foreground'
          >
            {theme === 'dark' ? (
              <SunIcon className='h-5 w-5' />
            ) : (
              <MoonIcon className='h-5 w-5' />
            )}
          </Button>

          {/* Settings */}
          <Link
            href={
              user.role === 'admin' ? '/admin/settings' : '/teacher/settings'
            }
          >
            <Button
              variant='ghost'
              size='sm'
              className='hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-foreground'
            >
              <Cog6ToothIcon className='h-5 w-5' />
            </Button>
          </Link>

          {/* Profile */}
          <div className='flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700'>
            <div className='w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-sm'>
              <span className='text-white font-medium gradient-text'>
                {getInitials(user.full_name)}
              </span>
            </div>
            <div className='hidden md:block text-right'>
              <p className='text-sm font-medium text-gray-900 dark:text-white'>
                {user.full_name}
              </p>
              <p className='text-xs text-gray-500 dark:text-primary-foreground/80'>
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
