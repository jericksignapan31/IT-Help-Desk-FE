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
            data: { roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
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
            data: { roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./assets/asset-list/asset-list.component').then(
                (m) => m.AssetListComponent,
              ),
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
          {
            path: 'create',
            loadComponent: () =>
              import('./branches/branch-list/branch-list.component').then(
                (m) => m.BranchListComponent,
              ),
          },
          {
            path: 'edit/:id',
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
        data: { roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
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
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
