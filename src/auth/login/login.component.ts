import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
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
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Real API authentication
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('🎉 LOGIN SUCCESSFUL!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 User Information:');
        console.log('   ID:', response.user?.id || 'N/A');
        console.log('   Username:', response.user?.username || 'N/A');
        console.log('   Email:', response.user?.email || 'N/A');
        console.log('   Role:', response.user?.role?.toUpperCase() || 'N/A');
        console.log('   Employee ID:', response.user?.employee_id || 'N/A');
        console.log('   Active:', response.user?.is_active ? '✅' : '❌');
        console.log('   Created:', response.user?.created_at || 'N/A');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 Access Token:', response.access_token || 'N/A');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Full Response Object:', response);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.loading = false;
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.loading = false;

        // Handle different error types
        if (err.status === 0) {
          this.error =
            'Cannot connect to server. Please check your connection.';
        } else if (err.status === 401) {
          this.error = 'Invalid username or password. Please try again.';
        } else if (err.status === 403) {
          this.error = 'Access denied. Your account may be disabled.';
        } else if (err.status === 500) {
          this.error = 'Server error. Please try again later.';
        } else {
          this.error =
            err.error?.message ||
            err.message ||
            'Login failed. Please try again.';
        }
      },
    });
  }
}
