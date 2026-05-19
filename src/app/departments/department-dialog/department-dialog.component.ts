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
import { DepartmentService } from '../../services/department.service';
import {
  Department,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
} from '../../models/department.model';
import Swal from 'sweetalert2';

export interface DepartmentDialogData {
  department?: Department;
  isEditMode: boolean;
}

@Component({
  selector: 'app-department-dialog',
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
  ],
  templateUrl: './department-dialog.component.html',
  styleUrls: ['./department-dialog.component.scss'],
})
export class DepartmentDialogComponent implements OnInit {
  departmentForm: FormGroup;
  isEditMode = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    public dialogRef: MatDialogRef<DepartmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DepartmentDialogData,
  ) {
    this.isEditMode = data.isEditMode;
    this.departmentForm = this.fb.group({
      department_name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.department) {
      this.departmentForm.patchValue(this.data.department);
    }
  }

  onSubmit(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const departmentData = this.departmentForm.value;

    
    const operation =
      this.isEditMode && this.data.department?.department_id
        ? this.departmentService.updateDepartment(
            this.data.department.department_id,
            departmentData as DepartmentUpdateRequest,
          )
        : this.departmentService.createDepartment(
            departmentData as DepartmentCreateRequest,
          );

    operation.subscribe({
      next: (result) => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Department ${this.isEditMode ? 'updated' : 'created'} successfully`,
          timer: 2000,
          showConfirmButton: false,
        });
        this.dialogRef.close(result);
      },
      error: (error) => {
      
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: `Failed to ${this.isEditMode ? 'update' : 'create'} department: ${error.error?.message || error.message || 'Unknown error'}`,
        });
        this.isSaving = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.departmentForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['maxLength'])
      return `Maximum length is ${control.errors['maxLength'].requiredLength}`;

    return 'Invalid value';
  }
}
