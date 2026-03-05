import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('../auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
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
      // Department Routes (Admin only)
      {
        path: 'departments',
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
      // Repair Log Routes
      {
        path: 'repair-logs',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
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
      // User Account Routes (Admin only)
      {
        path: 'user-accounts',
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
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
