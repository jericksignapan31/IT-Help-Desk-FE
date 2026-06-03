import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { UserAccountService } from '../../services/user-account.service';
import Swal from 'sweetalert2';
import { log } from 'console';

interface UserCredential {
  user_id: string;
  employee_id: string;
  username: string;
  password: string;
  employee_name: string;
  email: string;
  role: string;
  account_status: string;
  default_password_format: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-user-credentials',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
  ],
  templateUrl: './user-credentials.component.html',
  styleUrls: ['./user-credentials.component.scss'],
})
export class UserCredentialsComponent implements OnInit {
  credentials: UserCredential[] = [];
  dataSource = new MatTableDataSource<UserCredential>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  filteredCredentials: UserCredential[] = [];
  displayedColumns: string[] = [
    'email',
    'employee_name',
    'role',
    'account_status',
    'actions',
  ];
  loading = false;
  searchText = '';

  constructor(private userAccountService: UserAccountService) {}

  ngOnInit(): void {
    this.loadCredentials();
  }

  loadCredentials(): void {
    this.loading = true;
    this.userAccountService.getUserCredentials().subscribe({
      next: (data) => {
        this.credentials = data;
        this.applyFilter();
        this.dataSource.paginator = this.paginator;
        this.loading = false;
        console.log('User credentials loaded:', data);
      },
      error: (err) => {
        console.error('Failed to load credentials:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load user credentials',
        });
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    if (!this.searchText.trim()) {
      this.filteredCredentials = this.credentials;
    } else {
      const search = this.searchText.toLowerCase();
      this.filteredCredentials = this.credentials.filter(
        (cred) =>
          cred.email?.toLowerCase().includes(search) ||
          cred.employee_name?.toLowerCase().includes(search) ||
          cred.username?.toLowerCase().includes(search) ||
          cred.role?.toLowerCase().includes(search),
      );
    }
    this.dataSource.data = this.filteredCredentials;
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetPassword(credential: UserCredential): void {
    console.log('Resetting password for user:', credential);
    Swal.fire({
      title: 'Reset Password?',
      text: `Reset password for ${credential.username}? Password will be reset to: ${credential.default_password_format}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, reset it',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userAccountService.resetPassword(credential.employee_id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: `Password reset successfully. New password: ${credential.default_password_format}`,
              confirmButtonColor: '#1976d2',
            });
            this.loadCredentials();
          },
          error: (err) => {
            console.error('Failed to reset password:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text:
                err.error?.message ||
                'Failed to reset password. Please try again.',
              confirmButtonColor: '#1976d2',
            });
          },
        });
      }
    });
  }

  maskPassword(password: string): string {
    return '••••••••••••';
  }
}
