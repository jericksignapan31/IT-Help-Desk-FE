import { Component, OnInit } from '@angular/core';
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
import { MatStepperModule } from '@angular/material/stepper';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../app/services/auth.service';
import { EmployeeService } from '../../app/services/employee.service';
import { Branch } from '../../app/models/branch.model';
import { Department } from '../../app/models/department.model';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatSelectModule,
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
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
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  loading = false;
  error = '';
  hidePassword = true;
  branches: Branch[] = [];
  departments: Department[] = [];
  loadingData = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private employeeService: EmployeeService,
    private router: Router,
  ) {
    this.signupForm = this.fb.group({
      branch_id: ['', Validators.required],
      department_id: ['', Validators.required],
      first_name: ['', [Validators.required, Validators.maxLength(100)]],
      last_name: ['', [Validators.required, Validators.maxLength(100)]],
      middle_name: ['', Validators.maxLength(100)],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['employee'],
      position: ['', [Validators.required, Validators.maxLength(100)]],
      contact_number: ['', Validators.maxLength(20)],
    });
  }

  ngOnInit(): void {
    this.loadBranchesAndDepartments();
  }

  loadBranchesAndDepartments(): void {
    this.loadingData = true;

    this.employeeService.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
        console.log('Loaded branches:', this.branches);
      },
      error: (error) => {
        console.error('Failed to load branches:', error);
      },
    });

    this.employeeService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        console.log('Loaded departments:', this.departments);
        this.loadingData = false;
      },
      error: (error) => {
        console.error('Failed to load departments:', error);
        this.loadingData = false;
      },
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.signupForm.get(fieldName);
    if (!control) return 'Invalid field';
    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('email')) return 'Please enter a valid email';
    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Minimum length is ${minLength} characters`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Maximum length is ${maxLength} characters`;
    }
    return 'Invalid input';
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    // Submit form data directly to backend
    // Backend will auto-generate employee_id and handle password
    this.authService.register(this.signupForm.value).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.loading = false;

        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          html: `
            <p>Your account has been created successfully.</p>
            <p><strong>Please wait for admin approval before logging in.</strong></p>
            <p>You will be notified once your account is verified.</p>
          `,
          confirmButtonText: 'Go to Login',
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        console.error('Registration failed:', err);
        this.loading = false;

        if (err.status === 0) {
          this.error =
            'Cannot connect to server. Please check your connection.';
        } else if (err.status === 409) {
          this.error =
            'Email already exists. Please use a different email.';
        } else if (err.status === 400) {
          this.error =
            err.error?.message || 'Invalid data. Please check your inputs.';
        } else {
          this.error =
            err.error?.message ||
            err.message ||
            'Registration failed. Please try again.';
        }
      },
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
