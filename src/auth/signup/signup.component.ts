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
      employee_id: ['', [Validators.required, Validators.maxLength(50)]],
      branch_id: ['', Validators.required],
      department_id: ['', Validators.required],
      first_name: ['', [Validators.required, Validators.maxLength(100)]],
      last_name: ['', [Validators.required, Validators.maxLength(100)]],
      middle_name: ['', Validators.maxLength(100)],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
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

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    // Set password to employee_id@Lastname (capitalize first letter of last name)
    const lastName = this.signupForm.value.last_name;
    const capitalizedLastName =
      lastName.charAt(0).toUpperCase() + lastName.slice(1);

    const formData = {
      ...this.signupForm.value,
      password: this.signupForm.value.employee_id + '@' + capitalizedLastName,
    };

    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.loading = false;

        const lastName = this.signupForm.value.last_name;
        const capitalizedLastName =
          lastName.charAt(0).toUpperCase() + lastName.slice(1);
        const displayPassword =
          this.signupForm.value.employee_id + '@' + capitalizedLastName;

        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          html: `
            <p>Your account has been created successfully.</p>
            <p><strong>Your default password is: ${displayPassword}</strong></p>
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
            'Username or email already exists. Please use different credentials.';
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

  getErrorMessage(fieldName: string): string {
    const control = this.signupForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['email']) return 'Invalid email format';
    if (control.errors['minLength'])
      return `Minimum length is ${control.errors['minLength'].requiredLength}`;
    if (control.errors['maxLength'])
      return `Maximum length is ${control.errors['maxLength'].requiredLength}`;

    return '';
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
