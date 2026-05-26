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

    const formData = this.signupForm.value;
    
    console.log('📝 SIGNUP REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', formData.email);
    console.log('First Name:', formData.first_name);
    console.log('Last Name:', formData.last_name);
    console.log('Middle Name:', formData.middle_name);
    console.log('Branch ID:', formData.branch_id);
    console.log('Department ID:', formData.department_id);
    console.log('Position:', formData.position);
    console.log('Contact Number:', formData.contact_number);
    console.log('Role:', formData.role);
    console.log('Full Payload:', formData);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Submit form data directly to backend
    // Backend will auto-generate employee_id and handle password
    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('✅ REGISTRATION SUCCESSFUL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email:', response.email);
        console.log('Temporary Password:', response.temporary_password || response.temporaryPassword);
        console.log('Full Response:', response);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.loading = false;

        // Get temporary password from response (try both formats)
        const tempPassword = response.temporary_password || response.temporaryPassword;

        // Show temporary password modal
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful! 🎉',
          html: `
            <div style="text-align: left; line-height: 1.8;">
              <p style="font-size: 16px; margin-bottom: 20px;">Your account has been created successfully!</p>
              
              <div style="background: #f0f4ff; border-left: 4px solid #3f51b5; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <p style="margin: 8px 0; font-size: 14px;"><strong>📧 Email:</strong></p>
                <p style="margin: 8px 0; font-family: monospace; font-size: 16px; color: #3f51b5; font-weight: bold;">${response.email}</p>
              </div>
              
              <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <p style="margin: 8px 0; font-size: 14px;"><strong>🔑 Temporary Password:</strong></p>
                <p style="margin: 8px 0; font-family: monospace; font-size: 20px; color: #ff6f00; font-weight: bold; letter-spacing: 2px;">${tempPassword || 'N/A'}</p>
              </div>
              
              <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <p style="margin: 8px 0; font-size: 13px;">✅ <strong>Next Steps:</strong></p>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
                  <li>Save your temporary password securely</li>
                  <li>Login with your email and temporary password</li>
                  <li>You will be required to change your password immediately</li>
                </ul>
              </div>
            </div>
          `,
          confirmButtonText: 'Proceed to Login',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        console.error('❌ REGISTRATION FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Status Code:', err.status);
        console.error('Status Text:', err.statusText);
        console.error('URL:', err.url);
        console.error('Full Error Object:', err);
        console.error('Error Body:', err.error);
        console.error('Error Message:', err.error?.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
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
        } else if (err.status === 500) {
          this.error = `Server Error: ${err.error?.message || 'Internal server error. Please try again later.'}`;
        } else {
          this.error =
            err.error?.message ||
            err.message ||
            `Registration failed (${err.status}). Please try again.`;
        }
      },
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
