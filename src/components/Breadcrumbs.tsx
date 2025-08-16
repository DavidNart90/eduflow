'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-optimized';
import { generateBreadcrumbs } from '@/lib/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function Breadcrumbs() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const breadcrumbs = generateBreadcrumbs(pathname, user.role);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className='flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400'>
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className='flex items-center'>
          {index > 0 && (
            <ChevronRightIcon className='h-4 w-4 mx-1 text-gray-400' />
          )}

          {breadcrumb.href && !breadcrumb.current ? (
            <Link
              href={breadcrumb.href}
              className='hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center space-x-1'
            >
              {index === 0 ? <HomeIcon className='h-4 w-4' /> : null}
              <span>{breadcrumb.label}</span>
            </Link>
          ) : (
            <span
              className={`flex items-center space-x-1 ${
                breadcrumb.current
                  ? 'text-gray-900 dark:text-white font-medium'
                  : ''
              }`}
            >
              {index === 0 ? <HomeIcon className='h-4 w-4' /> : null}
              <span>{breadcrumb.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
