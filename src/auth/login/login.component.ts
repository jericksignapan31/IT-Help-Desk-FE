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
      username: [''],
      password: [''],
    });
  }

  onSubmit(): void {
    this.loading = true;
    this.error = '';

    // Auto login - no credentials needed for testing
    const mockResponse = {
      access_token: 'mock-token-' + Date.now(),
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin' as any,
        employeeId: 1,
        isActive: true,
        createdAt: new Date(),
      },
    };

    // Store in localStorage
    localStorage.setItem('access_token', mockResponse.access_token);
    localStorage.setItem('currentUser', JSON.stringify(mockResponse.user));

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 200);
  }
}
