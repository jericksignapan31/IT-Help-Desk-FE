import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  trigger,
  transition,
  style,
  animate,
} from '@angular/animations';
import { AuthService } from '../../app/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  animations: [
    trigger('errorAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          '200ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '150ms ease-in',
          style({ opacity: 0, transform: 'translateY(-10px)' }),
        ),
      ]),
    ]),
  ],
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  loading = false;
  error = '';
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  passwordStrength = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            this.passwordStrengthValidator.bind(this),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator.bind(this) },
    );

    // Listen to newPassword changes to update password strength
    this.changePasswordForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.updatePasswordStrength();
    });
  }

  /**
   * Validate password strength (must contain uppercase, lowercase, number, special char)
   */
  passwordStrengthValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const valid = hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

    if (!valid && value.length >= 8) {
      return {
        weakPassword: {
          message:
            'Password must contain uppercase, lowercase, number, and special character',
        },
      };
    }

    return null;
  }

  /**
   * Validate that new password and confirm password match
   */
  passwordsMatchValidator(
    group: AbstractControl,
  ): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword) {
      group.get('confirmPassword')?.setErrors(null);
    }

    return null;
  }

  /**
   * Update password strength indicator (0-100)
   */
  updatePasswordStrength(): void {
    const password = this.changePasswordForm.get('newPassword')?.value;
    if (!password) {
      this.passwordStrength = 0;
      return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;

    // Character type checks
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 10;

    this.passwordStrength = Math.min(strength, 100);
  }

  /**
   * Get password strength label and color
   */
  getPasswordStrengthLabel(): string {
    if (this.passwordStrength === 0) return '';
    if (this.passwordStrength < 40) return 'Weak';
    if (this.passwordStrength < 70) return 'Fair';
    if (this.passwordStrength < 90) return 'Good';
    return 'Strong';
  }

  /**
   * Get password strength color
   */
  getPasswordStrengthColor(): string {
    if (this.passwordStrength === 0) return 'transparent';
    if (this.passwordStrength < 40) return '#f44336'; // Red
    if (this.passwordStrength < 70) return '#ff9800'; // Orange
    if (this.passwordStrength < 90) return '#4caf50'; // Green
    return '#2196f3'; // Blue
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const payload = {
      currentPassword: this.changePasswordForm.value.currentPassword,
      newPassword: this.changePasswordForm.value.newPassword,
    };

    this.authService.changePassword(payload).subscribe({
      next: (response) => {
        console.log('✅ Password changed successfully');
        this.loading = false;

        Swal.fire({
          icon: 'success',
          title: 'Password Changed Successfully! ✅',
          html: `
            <div style="text-align: left; line-height: 1.8;">
              <p style="font-size: 16px; margin-bottom: 15px;">Your password has been updated successfully.</p>
              <p style="font-size: 14px; color: #666;">You can now login with your new password.</p>
            </div>
          `,
          confirmButtonText: 'Go to Dashboard',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        console.error('Failed to change password:', err);
        this.loading = false;

        if (err.status === 401) {
          this.error =
            'Current password is incorrect. Please try again.';
        } else if (err.status === 400) {
          this.error =
            err.error?.message ||
            'Invalid password format. Please check requirements.';
        } else if (err.status === 0) {
          this.error =
            'Cannot connect to server. Please check your connection.';
        } else {
          this.error =
            err.error?.message ||
            err.message ||
            'Failed to change password. Please try again.';
        }
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.changePasswordForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) {
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['weakPassword']) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    if (control.errors['passwordMismatch']) {
      return 'Passwords do not match';
    }

    return 'Invalid input';
  }

  hasSpecialChar(): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value;
    if (!password) return false;
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  }

  hasLowercase(): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value;
    if (!password) return false;
    return /[a-z]/.test(password);
  }

  hasUppercase(): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value;
    if (!password) return false;
    return /[A-Z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value;
    if (!password) return false;
    return /[0-9]/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value;
    if (!password) return false;
    return password.length >= 8;
  }
}
