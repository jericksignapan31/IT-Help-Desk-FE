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
import { MenuItem, MENU_ITEMS } from '../models/menu-item.model';

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
  menuItems: MenuItem[] = MENU_ITEMS;

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        console.log('👤 Current User in Layout:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   ID:', user.id || 'N/A');
        console.log('   Username:', user.username || 'N/A');
        console.log('   Email:', user.email || 'N/A');
        console.log('   Role:', user.role?.toUpperCase() || 'N/A');
        console.log('   Employee ID:', user.employee_id || 'N/A');
        console.log('   Active:', user.is_active ? '✅' : '❌');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Full User Object:', user);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
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
