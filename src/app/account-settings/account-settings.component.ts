import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss'],
})
export class AccountSettingsComponent {
  changePasswordForm: FormGroup;
  loading = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      return;
    }

    const { currentPassword, newPassword } = this.changePasswordForm.value;

    Swal.fire({
      title: 'Change Password?',
      text: 'Are you sure you want to change your password?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, change it',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;

        // Debug: Check if token exists
        const token = localStorage.getItem('access_token');
        console.log('🔑 Token exists:', !!token);
        if (token) {
          console.log('🔑 Token preview:', token.substring(0, 20) + '...');
        }
        console.log('📤 Sending change password request...');

        this.authService
          .changePassword({ currentPassword, newPassword })
          .subscribe({
            next: (response) => {
              this.loading = false;
              console.log('✅ Password changed successfully:', response);
              Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: response.message || 'Password changed successfully',
                confirmButtonColor: '#1976d2',
              });
              this.changePasswordForm.reset();
            },
            error: (err) => {
              this.loading = false;
              console.error('❌ Password change failed:', err);
              console.error('❌ Error status:', err.status);
              console.error('❌ Error details:', err.error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text:
                  err.error?.message ||
                  'Failed to change password. Please try again.',
                confirmButtonColor: '#1976d2',
              });
            },
          });
      }
    });
  }

  getPasswordErrorMessage(): string {
    const newPassword = this.changePasswordForm.get('newPassword');
    if (newPassword?.hasError('required')) {
      return 'New password is required';
    }
    if (newPassword?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }
}
