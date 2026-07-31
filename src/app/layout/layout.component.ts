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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../services/auth.service';
import { ChatStoreService } from '../chat/store/chat-store.service';
import { TicketService } from '../services/ticket.service';
import { WarehouseService } from '../services/warehouse.service';
import { User, UserRole } from '../models/user.model';
import { MenuItem, MENU_ITEMS } from '../models/menu-item.model';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

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
    MatExpansionModule,
    MatDividerModule,
    MatBadgeModule,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  currentUser: User | null = null;
  isSidenavOpen = true;
  menuItems: MenuItem[] = MENU_ITEMS;
  expandedMenus: { [key: string]: boolean } = {};
  unreadChatCount$: Observable<number>;
  pendingTicketsCount$: Observable<number>;
  approvedTicketsCount$: Observable<number>;
  inProgressTicketsCount$: Observable<number>;
  pendingReviewCount$: Observable<number>;
  adminApprovalCount$: Observable<number>;
  approvedRequisitionsCount$: Observable<number>;

  constructor(
    public authService: AuthService,
    private chatStore: ChatStoreService,
    private ticketService: TicketService,
    private warehouseService: WarehouseService,
    private router: Router,
  ) {
    this.unreadChatCount$ = this.chatStore.unreadCount$;
    this.pendingTicketsCount$ = this.ticketService.getPendingTickets().pipe(
      map((tickets) => tickets.length),
      catchError(() => of(0)),
      shareReplay(1),
    );
    this.approvedTicketsCount$ = this.ticketService.getApprovedTickets().pipe(
      map((tickets) => tickets.length),
      catchError(() => of(0)),
      shareReplay(1),
    );
    this.inProgressTicketsCount$ = this.ticketService.getInProgressTickets().pipe(
      map((tickets) => tickets.length),
      catchError(() => of(0)),
      shareReplay(1),
    );
    this.pendingReviewCount$ = this.warehouseService.getPendingRequisitions().pipe(
      map((requisitions) => requisitions.length),
      catchError(() => of(0)),
      shareReplay(1),
    );
    this.adminApprovalCount$ = this.warehouseService.getPendingAdminReview().pipe(
      map(
        (requisitions) =>
          requisitions.filter((req) => req.status === 'pending_admin_review').length,
      ),
      catchError(() => of(0)),
      shareReplay(1),
    );
    this.approvedRequisitionsCount$ = this.warehouseService.getApprovedRequisitions().pipe(
      map((requisitions) => requisitions.length),
      catchError(() => of(0)),
      shareReplay(1),
    );
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
    return this.menuItems.filter((item) => this.canAccessMenuItem(item) && item.label !== 'Chat');
  }

  getVisibleChildren(item: MenuItem): MenuItem[] {
    if (!item.children) {
      return [];
    }
    return item.children.filter((child) => this.canAccessMenuItem(child));
  }

  hasVisibleChildren(item: MenuItem): boolean {
    return this.getVisibleChildren(item).length > 0;
  }

  isChildVisible(item: MenuItem, childLabel: string): boolean {
    return this.getVisibleChildren(item).some((child) => child.label === childLabel);
  }

  getChildBadgeCount$(parentLabel: string, childLabel: string): Observable<number> | null {
    if (parentLabel === 'Tickets') {
      switch (childLabel) {
        case 'Pending':
          return this.pendingTicketsCount$;
        case 'Approved':
          return this.approvedTicketsCount$;
        case 'Work in Progress':
          return this.inProgressTicketsCount$;
      }
    }
    if (parentLabel === 'Request Item') {
      switch (childLabel) {
        case 'Pending Review':
          return this.pendingReviewCount$;
        case 'Admin Approval':
          return this.adminApprovalCount$;
        case 'Approved':
          return this.approvedRequisitionsCount$;
      }
    }
    return null;
  }

  getChildBadgeClass(childLabel: string): string {
    switch (childLabel) {
      case 'Pending':
      case 'Pending Review':
        return 'badge-pending';
      case 'Approved':
        return 'badge-approved';
      case 'Work in Progress':
      case 'Admin Approval':
        return 'badge-progress';
      default:
        return '';
    }
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToAccountSettings(): void {
    this.router.navigate(['/account-settings']);
  }

  logout(): void {
    this.authService.logout();
  }

  getRoleBadgeClass(): string {
    if (this.authService.isAdmin()) return 'role-admin';
    if (this.authService.isTechnician()) return 'role-technician';
    if (this.currentUser?.role === UserRole.WAREHOUSE) return 'role-warehouse';
    return 'role-user';
  }

  getRoleLabel(): string {
    return this.currentUser?.role || '';
  }

  getFullName(): string {
    const user = this.currentUser as any;
    const firstName = user?.employee?.first_name || user?.first_name || '';
    const lastName = user?.employee?.last_name || user?.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  getPosition(): string {
    const user = this.currentUser as any;
    return user?.employee?.position || 'User';
  }

  getEmployeeId(): string {
    const user = this.currentUser as any;
    return user?.employee?.employee_id || user?.employee_id || '';
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }
}
