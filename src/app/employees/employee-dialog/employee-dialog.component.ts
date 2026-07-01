import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeService } from '../../services/employee.service';
import {
  Employee,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
} from '../../models/employee.model';
import { Branch } from '../../models/branch.model';
import { Department } from '../../models/department.model';
import Swal from 'sweetalert2';

export interface EmployeeDialogData {
  employee?: Employee;
  isEditMode: boolean;
}

@Component({
  selector: 'app-employee-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './employee-dialog.component.html',
  styleUrls: ['./employee-dialog.component.scss'],
})
export class EmployeeDialogComponent implements OnInit {
  employeeForm: FormGroup;
  isEditMode = false;
  isSaving = false;
  branches: Branch[] = [];
  departments: Department[] = [];
  loadingData = true;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    public dialogRef: MatDialogRef<EmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmployeeDialogData,
  ) {
    this.isEditMode = data.isEditMode;
    this.employeeForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.maxLength(100)]],
      last_name: ['', [Validators.required, Validators.maxLength(100)]],
      middle_name: ['', Validators.maxLength(100)],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
      contact_number: ['', Validators.maxLength(20)],
      position: ['', [Validators.required, Validators.maxLength(100)]],
      role: ['employee', Validators.required],
      branch_id: [''],
      department_id: [''],
    });
  }

  ngOnInit(): void {
    this.loadBranchesAndDepartments();
    if (this.isEditMode && this.data.employee) {
      this.employeeForm.patchValue(this.data.employee);
    }
  }

  loadBranchesAndDepartments(): void {
    this.loadingData = true;

    // Load branches
    this.employeeService.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load branches',
        });
      },
    });

    // Load departments
    this.employeeService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.loadingData = false;
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load departments',
        });
        this.loadingData = false;
      },
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const employeeData = this.employeeForm.value;


    // Check if token exists
    const token = localStorage.getItem('access_token');
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Not Authenticated',
        text: 'You are not logged in. Please login again.',
      });
      this.isSaving = false;
      return;
    }

    const operation =
      this.isEditMode && this.data.employee?.employee_id
        ? this.employeeService.updateEmployee(
            this.data.employee.employee_id,
            employeeData as EmployeeUpdateRequest,
          )
        : this.employeeService.createEmployee(
            employeeData as EmployeeCreateRequest,
          );

    operation.subscribe({
      next: (result) => {
        this.isSaving = false;
        
        console.log('🎉 EMPLOYEE CREATION RESPONSE:');
        console.log('Full Response:', result);
        console.log('temporaryPassword:', result.temporaryPassword);
        
        // Show temporary password modal for new employees
        if (!this.isEditMode) {
          const tempPassword = result.temporaryPassword || result.temporary_password || 'N/A';
          Swal.fire({
            icon: 'success',
            title: 'Employee Created Successfully! 🎉',
            html: `
              <div style="text-align: left; line-height: 1.8;">
                <p style="font-size: 16px; margin-bottom: 20px;">New employee account has been created successfully!</p>
                
                <div style="background: #f0f4ff; border-left: 4px solid #3f51b5; padding: 15px; border-radius: 4px; margin: 15px 0;">
                  <p style="margin: 8px 0; font-size: 14px;"><strong>📧 Email:</strong></p>
                  <p style="margin: 8px 0; font-family: monospace; font-size: 16px; color: #3f51b5; font-weight: bold;">${result.email}</p>
                </div>
                
                <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px; margin: 15px 0;">
                  <p style="margin: 8px 0; font-size: 14px;"><strong>🔑 Temporary Password:</strong></p>
                  <p style="margin: 8px 0; font-family: monospace; font-size: 20px; color: #ff6f00; font-weight: bold; letter-spacing: 2px;">${tempPassword}</p>
                </div>
                
                <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px; margin: 15px 0;">
                  <p style="margin: 8px 0; font-size: 13px;">✅ <strong>Next Steps:</strong></p>
                  <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
                    <li>Save and share this temporary password with the employee</li>
                    <li>Employee must login with this email and password</li>
                    <li>They will be required to change their password on first login</li>
                  </ul>
                </div>
              </div>
            `,
            confirmButtonText: 'Copy & Close',
            didOpen: () => {
              // Add copy to clipboard functionality
              const copyBtn = Swal.getConfirmButton();
              if (copyBtn && tempPassword && tempPassword !== 'N/A') {
                copyBtn.addEventListener('click', () => {
                  navigator.clipboard.writeText(tempPassword);
                });
              }
            }
          }).then(() => {
            this.dialogRef.close(result);
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Employee updated successfully`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.dialogRef.close(result);
        }
      },
      error: (error) => {
 
        // Log detailed validation errors if available
        if (error.error?.message && Array.isArray(error.error.message)) {
        }

        let errorMessage = 'Unknown error';
        if (error.error?.message) {
          if (Array.isArray(error.error.message)) {
            errorMessage = error.error.message.join(', ');
          } else {
            errorMessage = error.error.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: `Failed to ${this.isEditMode ? 'update' : 'create'} employee: ${errorMessage}`,
        });
        this.isSaving = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.employeeForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['maxLength'])
      return `Maximum length is ${control.errors['maxLength'].requiredLength}`;
    if (control.errors['email']) return 'Invalid email format';

    return 'Invalid value';
  }
}
