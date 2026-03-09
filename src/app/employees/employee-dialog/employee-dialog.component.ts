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
      employee_id: ['', [Validators.required, Validators.maxLength(50)]],
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
      // Disable employee_id in edit mode since it shouldn't be changed
      this.employeeForm.get('employee_id')?.disable();
    }
  }

  loadBranchesAndDepartments(): void {
    this.loadingData = true;

    // Load branches
    this.employeeService.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
        console.log('Loaded branches:', this.branches);
      },
      error: (error) => {
        console.error('Failed to load branches:', error);
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
        console.log('Loaded departments:', this.departments);
        this.loadingData = false;
      },
      error: (error) => {
        console.error('Failed to load departments:', error);
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
    let employeeData = this.employeeForm.value;

    console.log('Saving employee - Edit Mode:', this.isEditMode);
    console.log('Employee ID:', this.data.employee?.employee_id);
    console.log('Employee Data (raw):', employeeData);

    // In edit mode, remove employee_id from the data being sent
    // because employee_id is usually immutable and shouldn't be updated
    if (this.isEditMode) {
      const { employee_id, ...updateData } = employeeData;
      console.log('Employee Data (for update, without ID):', updateData);
      employeeData = updateData;
    }

    console.log('Employee Data (final):', employeeData);

    // Check if token exists
    const token = localStorage.getItem('access_token');
    console.log('🔐 Token exists:', !!token);
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
        console.log('Employee save SUCCESS:', result);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Employee ${this.isEditMode ? 'updated' : 'created'} successfully`,
          timer: 2000,
          showConfirmButton: false,
        });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Employee save FAILED - Full error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);

        // Log detailed validation errors if available
        if (error.error?.message && Array.isArray(error.error.message)) {
          console.error('Validation errors:', error.error.message);
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
