import { UserRole } from './user.model';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
}

export const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  {
    label: 'My Tickets',
    icon: 'confirmation_number',
    route: '/tickets/my-tickets',
  },
  {
    label: 'All Tickets',
    icon: 'list_alt',
    route: '/tickets',
    roles: [UserRole.ADMIN, UserRole.TECHNICIAN],
  },
  {
    label: 'Assigned to Me',
    icon: 'assignment_ind',
    route: '/tickets/assigned',
    roles: [UserRole.TECHNICIAN, UserRole.ADMIN],
  },
  { label: 'Assets', icon: 'devices', route: '/assets' },
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
    label: 'Branches',
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
    label: 'Repair Logs',
    icon: 'build',
    route: '/repair-logs',
    roles: [UserRole.ADMIN, UserRole.TECHNICIAN],
  },

  {
    label: 'User Credentials',
    icon: 'vpn_key',
    route: '/user-credentials',
    roles: [UserRole.ADMIN],
  },
];
