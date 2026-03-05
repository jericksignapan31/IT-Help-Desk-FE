import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../services/auth.service';
import { User, UserRole } from '../models/user.model';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  currentUser: User | null = null;
  isSidenavOpen = true;
  menuItems: MenuItem[] = [
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
      label: 'User Accounts',
      icon: 'account_circle',
      route: '/user-accounts',
      roles: [UserRole.ADMIN],
    },
  ];

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
  }

  canAccessMenuItem(item: MenuItem): boolean {
    if (!item.roles) {
      return true;
    }
    return this.authService.hasRole(item.roles);
  }

  get visibleMenuItems(): MenuItem[] {
    return this.menuItems.filter((item) => this.canAccessMenuItem(item));
  }

  logout(): void {
    this.authService.logout();
  }

  getRoleBadgeClass(): string {
    if (this.authService.isAdmin()) return 'role-admin';
    if (this.authService.isTechnician()) return 'role-technician';
    return 'role-user';
  }

  getRoleLabel(): string {
    return this.currentUser?.role || '';
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }
}
