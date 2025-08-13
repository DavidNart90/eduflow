import {
  HomeIcon,
  UserIcon,
  DocumentTextIcon,
  CogIcon,
  UsersIcon,
  CurrencyDollarIcon,
  PlusIcon,
  DocumentArrowUpIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavigationItem[];
  roles: ('teacher' | 'admin')[];
  external?: boolean;
}

export interface SidebarConfig {
  teacher: NavigationItem[];
  admin: NavigationItem[];
}

// Teacher Navigation Items
export const teacherNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/teacher/dashboard',
    icon: HomeIcon,
    roles: ['teacher'],
    children: [
      {
        id: 'add-savings',
        label: 'Add Savings',
        href: '/teacher/add-savings',
        icon: PlusIcon,
        roles: ['teacher'],
      },
      {
        id: 'savings-history',
        label: 'Savings History',
        href: '/teacher/savings-history',
        icon: DocumentTextIcon,
        roles: ['teacher'],
      },
    ],
  },
  {
    id: 'statements',
    label: 'Statements',
    href: '/teacher/statements',
    icon: DocumentTextIcon,
    roles: ['teacher'],
    children: [
      {
        id: 'monthly',
        label: 'Monthly Statements',
        href: '/teacher/statements/monthly',
        icon: DocumentTextIcon,
        roles: ['teacher'],
      },
      {
        id: 'quarterly',
        label: 'Quarterly Reports',
        href: '/teacher/statements/quarterly',
        icon: DocumentTextIcon,
        roles: ['teacher'],
      },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/teacher/profile',
    icon: UserIcon,
    roles: ['teacher'],
  },
  {
    id: 'settings',
    label: 'Account Settings',
    href: '/teacher/settings',
    icon: CogIcon,
    roles: ['teacher'],
  },
];

// Admin Navigation Items
export const adminNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: HomeIcon,
    roles: ['admin'],
  },
  {
    id: 'upload-report',
    label: 'Upload Controller Report',
    href: '/admin/upload-report',
    icon: DocumentArrowUpIcon,
    roles: ['admin'],
  },
  {
    id: 'generate-reports',
    label: 'Generate Monthly Reports',
    href: '/admin/generate-reports',
    icon: DocumentTextIcon,
    roles: ['admin'],
  },
  {
    id: 'trigger-interest',
    label: 'Trigger Quarterly Interest',
    href: '/admin/trigger-interest',
    icon: CurrencyDollarIcon,
    roles: ['admin'],
  },
  {
    id: 'manage-teachers',
    label: 'Manage Teachers',
    href: '/admin/manage-teachers',
    icon: UsersIcon,
    roles: ['admin'],
  },
  {
    id: 'email-log',
    label: 'Email Log',
    href: '/admin/email-log',
    icon: EnvelopeIcon,
    roles: ['admin'],
  },
  {
    id: 'settings',
    label: 'Account Settings',
    href: '/admin/settings',
    icon: CogIcon,
    roles: ['admin'],
  },
];

// Sidebar Configuration
export const sidebarConfig: SidebarConfig = {
  teacher: teacherNavigation,
  admin: adminNavigation,
};

// Utility functions
export function getNavigationForRole(
  role: 'teacher' | 'admin'
): NavigationItem[] {
  return role === 'teacher' ? teacherNavigation : adminNavigation;
}

export function isActiveRoute(currentPath: string, href: string): boolean {
  if (href === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(href);
}

export function hasActiveChild(
  currentPath: string,
  items: NavigationItem[]
): boolean {
  return items.some(item => {
    if (isActiveRoute(currentPath, item.href)) {
      return true;
    }
    if (item.children) {
      return hasActiveChild(currentPath, item.children);
    }
    return false;
  });
}

// Breadcrumb types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export function generateBreadcrumbs(
  pathname: string,
  role: 'teacher' | 'admin'
): BreadcrumbItem[] {
  const navigation = getNavigationForRole(role);
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Home',
      href: role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard',
    },
  ];

  // Find the current navigation item
  const findCurrentItem = (
    items: NavigationItem[],
    path: string
  ): NavigationItem | null => {
    for (const item of items) {
      if (isActiveRoute(path, item.href)) {
        return item;
      }
      if (item.children) {
        const childItem = findCurrentItem(item.children, path);
        if (childItem) {
          return childItem;
        }
      }
    }
    return null;
  };

  const currentItem = findCurrentItem(navigation, pathname);

  if (currentItem) {
    // Find parent item
    const findParent = (
      items: NavigationItem[],
      target: NavigationItem
    ): NavigationItem | null => {
      for (const item of items) {
        if (item.children?.some(child => child.id === target.id)) {
          return item;
        }
        if (item.children) {
          const parent = findParent(item.children, target);
          if (parent) return parent;
        }
      }
      return null;
    };

    const parentItem = findParent(navigation, currentItem);

    if (parentItem && parentItem.id !== currentItem.id) {
      breadcrumbs.push({
        label: parentItem.label,
        href: parentItem.href,
      });
    }

    breadcrumbs.push({
      label: currentItem.label,
      href: currentItem.href,
      current: true,
    });
  }

  return breadcrumbs;
}
