import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserAccountService } from '../../services/user-account.service';
import Swal from 'sweetalert2';

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
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-credentials.component.html',
  styleUrls: ['./user-credentials.component.scss'],
})
export class UserCredentialsComponent implements OnInit {
  credentials: UserCredential[] = [];
  displayedColumns: string[] = [
    'username',
    'password',
    'account_status',
    'actions',
  ];
  loading = false;

  constructor(private userAccountService: UserAccountService) {}

  ngOnInit(): void {
    this.loadCredentials();
  }

  loadCredentials(): void {
    this.loading = true;
    this.userAccountService.getUserCredentials().subscribe({
      next: (data) => {
        this.credentials = data;
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

  resetPassword(credential: UserCredential): void {
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
        this.userAccountService.resetPassword(credential.user_id).subscribe({
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
