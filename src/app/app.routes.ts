import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('../auth/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('../auth/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'test',
    loadComponent: () =>
      import('./test/test.component').then((m) => m.TestComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      // Dashboard Route
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      // Ticket Routes
      {
        path: 'tickets',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./tickets/ticket-list/ticket-list.component').then(
                (m) => m.TicketListComponent,
              ),
            canActivate: [roleGuard],
            data: { roles: [UserRole.ADMIN, UserRole.SUPERVISOR] },
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./tickets/ticket-form/ticket-form.component').then(
                (m) => m.TicketFormComponent,
              ),
          },
          {
            path: 'my-tickets',
            loadComponent: () =>
              import('./tickets/my-tickets/my-tickets.component').then(
                (m) => m.MyTicketsComponent,
              ),
          },
          {
            path: 'pending',
            loadComponent: () =>
              import('./tickets/ticket-list/ticket-list.component').then(
                (m) => m.TicketListComponent,
              ),
            data: { statusFilter: 'pending_approval' },
          },
          {
            path: 'approved',
            loadComponent: () =>
              import('./tickets/ticket-list/ticket-list.component').then(
                (m) => m.TicketListComponent,
              ),
            data: { statusFilter: 'approved' },
          },
          {
            path: 'in-progress',
            loadComponent: () =>
              import('./tickets/ticket-list/ticket-list.component').then(
                (m) => m.TicketListComponent,
              ),
            data: { statusFilter: 'in_progress' },
          },
          {
            path: 'hold',
            loadComponent: () =>
              import('./tickets/ticket-list/ticket-list.component').then(
                (m) => m.TicketListComponent,
              ),
            data: { statusFilter: 'hold' },
          },
          {
            path: 'completed',
            loadComponent: () =>
              import('./tickets/ticket-list/ticket-list.component').then(
                (m) => m.TicketListComponent,
              ),
            data: { statusFilter: 'completed' },
          },
          {
            path: 'pending-approvals',
            loadComponent: () =>
              import('./tickets/pending-approvals/pending-approvals.component').then(
                (m) => m.PendingApprovalsComponent,
              ),
            canActivate: [roleGuard],
            data: { roles: [UserRole.SUPERVISOR, UserRole.ADMIN] },
          },
          {
            path: 'assigned',
            loadComponent: () =>
              import('./tickets/assigned-tickets/assigned-tickets.component').then(
                (m) => m.AssignedTicketsComponent,
              ),
            canActivate: [roleGuard],
            data: { roles: [UserRole.ADMIN, UserRole.IT] },
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./tickets/ticket-form/ticket-form.component').then(
                (m) => m.TicketFormComponent,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./tickets/ticket-form/ticket-form.component').then(
                (m) => m.TicketFormComponent,
              ),
          },
        ],
      },
      // Asset Routes
      {
        path: 'assets',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./assets/asset-list/asset-list.component').then(
                (m) => m.AssetListComponent,
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./assets/asset-list/asset-list.component').then(
                (m) => m.AssetListComponent,
              ),
            canActivate: [roleGuard],
            data: { roles: [UserRole.ADMIN, UserRole.IT] },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./assets/asset-list/asset-list.component').then(
                (m) => m.AssetListComponent,
              ),
          },
          {
            path: 'scanner/index',
            loadComponent: () =>
              import('./assets/asset-scanner/asset-scanner.component').then(
                (m) => m.AssetScannerComponent,
              ),
            canActivate: [roleGuard],
            data: { roles: [UserRole.ADMIN, UserRole.IT] },
          },
        ],
      },
      // Employee Routes (Admin only)
      {
        path: 'employees',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./employees/employee-list/employee-list.component').then(
                (m) => m.EmployeeListComponent,
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./employees/employee-list/employee-list.component').then(
                (m) => m.EmployeeListComponent,
              ),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./employees/employee-list/employee-list.component').then(
                (m) => m.EmployeeListComponent,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./employees/employee-list/employee-list.component').then(
                (m) => m.EmployeeListComponent,
              ),
          },
        ],
      },
      // Branch Routes (Admin only)
      {
        path: 'branches',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./branches/branch-list/branch-list.component').then(
                (m) => m.BranchListComponent,
              ),
          },
        ],
      },
      // Brand Routes (Admin only)
      {
        path: 'brands',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./brands/brand-list/brand-list.component').then(
                (m) => m.BrandListComponent,
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./brands/brand-form/brand-form.component').then(
                (m) => m.BrandFormComponent,
              ),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./brands/brand-form/brand-form.component').then(
                (m) => m.BrandFormComponent,
              ),
          },
        ],
      },
      // Department Routes (Admin only)
      {
        path: 'departments',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./departments/department-list/department-list.component').then(
                (m) => m.DepartmentListComponent,
              ),
          },
        ],
      },
      // Repair Log Routes
      {
        path: 'repair-logs',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.IT] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./repair-logs/repair-log-list/repair-log-list.component').then(
                (m) => m.RepairLogListComponent,
              ),
          },
        ],
      },
      // Reports Routes (Admin only)
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./reports/reports.component').then(
                (m) => m.ReportsComponent,
              ),
          },
        ],
      },
      // Chat Routes (All authenticated users)
      {
        path: 'chat',
        loadComponent: () =>
          import('./shared/group-chat/group-chat.component').then(
            (m) => m.GroupChatComponent,
          ),
      },
      // User Account Routes (Admin only)
      {
        path: 'user-accounts',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./user-accounts/user-account-list/user-account-list.component').then(
                (m) => m.UserAccountListComponent,
              ),
          },
        ],
      },
      // User Credentials Route (Admin only)
      {
        path: 'user-credentials',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./user-accounts/user-credentials/user-credentials.component').then(
            (m) => m.UserCredentialsComponent,
          ),
      },
      // Profile Route (All authenticated users)
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then((m) => m.ProfileComponent),
      },
      // Account Settings Route (All authenticated users)
      {
        path: 'account-settings',
        loadComponent: () =>
          import('./account-settings/account-settings.component').then(
            (m) => m.AccountSettingsComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
