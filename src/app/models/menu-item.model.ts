import { UserRole } from './user.model';

export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  roles?: UserRole[];
  children?: MenuItem[];
}

export const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  {
    label: 'Tickets',
    icon: 'confirmation_number',
    children: [
      {
        label: 'My Tickets',
        icon: 'person',
        route: '/tickets/my-tickets',
      },
      {
        label: 'Pending',
        icon: 'pending',
        route: '/tickets/pending',
      },
      {
        label: 'Approved',
        icon: 'check',
        route: '/tickets/approved',
      },
       {
        label: 'Rejected',
        icon: 'close',
        route: '/tickets/rejected',
      },
      {
        label: 'Work in Progress',
        icon: 'autorenew',
        route: '/tickets/in-progress',
      },
      {
        label: 'On Hold',
        icon: 'hourglass_top',
        route: '/tickets/hold',
      },
      {
        label: 'Completed',
        icon: 'check_circle',
        route: '/tickets/completed',
      },
    ],
  },
  { label: 'Assets', icon: 'devices', route: '/assets' },
  {
    label: 'Request Item',
    icon: 'request_page',
    roles: [UserRole.IT, UserRole.WAREHOUSE, UserRole.ADMIN],
    children: [
      {
        label: 'Create/View',
        icon: 'add_circle',
        route: '/requisitions',
        roles: [UserRole.IT, UserRole.WAREHOUSE],
      },
      {
        label: 'Pending Review',
        icon: 'pending_actions',
        route: '/requisitions/pending',
        roles: [UserRole.WAREHOUSE],
      },
      {
        label: 'Admin Approval',
        icon: 'approval',
        route: '/requisitions/pending-admin-review',
        roles: [UserRole.ADMIN],
      },
      {
        label: 'Approved',
        icon: 'verified',
        route: '/requisitions/approved',
      },
      {
        label: 'Inventory',
        icon: 'inventory_2',
        route: '/requisitions/inventory',
      },
    ],
  },
  {
    label: 'Brands',
    icon: 'label',
    route: '/brands',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Employees',
    icon: 'people',
    route: '/employees',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Offices',
    icon: 'business',
    route: '/branches',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Departments',
    icon: 'corporate_fare',
    route: '/departments',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Logs',
    icon: 'assessment',
    route: '/repair-logs',
    roles: [UserRole.ADMIN, UserRole.IT],
  },
  {
    label: 'Chat',
    icon: 'chat',
    route: '/chat',
  },
  {
    label: 'Reports',
    icon: 'bar_chart',
    route: '/reports',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'User Credentials',
    icon: 'vpn_key',
    route: '/user-credentials',
    roles: [UserRole.ADMIN],
  },
];
