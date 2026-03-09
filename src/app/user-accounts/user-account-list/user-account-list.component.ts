import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserAccountService } from '../../services/user-account.service';
import { UserAccount } from '../../models/user.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-account-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './user-account-list.component.html',
  styleUrls: ['./user-account-list.component.scss'],
})
export class UserAccountListComponent implements OnInit {
  userAccounts: UserAccount[] = [];
  displayedColumns: string[] = [
    'username',
    'email',
    'employee',
    'role',
    'verification',
    'status',
    'actions',
  ];
  isLoading = false;

  constructor(
    private userAccountService: UserAccountService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadUserAccounts();
  }

  loadUserAccounts(): void {
    this.isLoading = true;
    this.userAccountService.getUserAccounts().subscribe({
      next: (userAccounts) => {
        this.userAccounts = userAccounts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user accounts:', error);
        this.snackBar.open('Failed to load user accounts', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  createUserAccount(): void {
    this.router.navigate(['/user-accounts/create']);
  }

  editUserAccount(userAccount: UserAccount): void {
    this.router.navigate(['/user-accounts/edit', userAccount.id]);
  }

  deleteUserAccount(userAccount: UserAccount): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User Account',
        message: `Are you sure you want to delete user "${userAccount.username}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && userAccount.id) {
        this.userAccountService.deleteUserAccount(userAccount.id).subscribe({
          next: () => {
            this.snackBar.open('User account deleted successfully', 'Close', {
              duration: 3000,
            });
            this.loadUserAccounts();
          },
          error: (error) => {
            console.error('Error deleting user account:', error);
            this.snackBar.open('Failed to delete user account', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  toggleStatus(userAccount: UserAccount): void {
    if (!userAccount.id) return;

    const newStatus = !userAccount.is_active;
    this.userAccountService
      .updateUserAccount(userAccount.id, { is_active: newStatus })
      .subscribe({
        next: () => {
          this.snackBar.open(
            `User account ${newStatus ? 'activated' : 'deactivated'} successfully`,
            'Close',
            { duration: 3000 },
          );
          this.loadUserAccounts();
        },
        error: (error) => {
          console.error('Error updating user account status:', error);
          this.snackBar.open('Failed to update user account status', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  getRoleBadgeClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'role-admin';
      case 'technician':
        return 'role-technician';
      default:
        return 'role-user';
    }
  }

  approveAccount(userAccount: UserAccount): void {
    if (!userAccount.id) return;

    Swal.fire({
      title: 'Approve Account',
      text: `Approve account for "${userAccount.username}"? They will be able to log in.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && userAccount.id) {
        this.userAccountService.approveAccount(userAccount.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Approved!',
              text: 'Account has been approved successfully',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadUserAccounts();
          },
          error: (error) => {
            console.error('Error approving account:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to approve account',
            });
          },
        });
      }
    });
  }

  rejectAccount(userAccount: UserAccount): void {
    if (!userAccount.id) return;

    Swal.fire({
      title: 'Reject Account',
      text: `Reject and delete account for "${userAccount.username}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && userAccount.id) {
        this.userAccountService.rejectAccount(userAccount.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Rejected!',
              text: 'Account has been rejected and deleted',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadUserAccounts();
          },
          error: (error) => {
            console.error('Error rejecting account:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to reject account',
            });
          },
        });
      }
    });
  }
}
