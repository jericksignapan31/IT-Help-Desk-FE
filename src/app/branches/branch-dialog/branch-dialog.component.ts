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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BranchService } from '../../services/branch.service';
import Swal from 'sweetalert2';
import {
  Branch,
  BranchCreateRequest,
  BranchUpdateRequest,
} from '../../models/branch.model';

export interface BranchDialogData {
  branch?: Branch;
  isEditMode: boolean;
}

@Component({
  selector: 'app-branch-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './branch-dialog.component.html',
  styleUrls: ['./branch-dialog.component.scss'],
})
export class BranchDialogComponent implements OnInit {
  branchForm: FormGroup;
  isEditMode = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private branchService: BranchService,
    public dialogRef: MatDialogRef<BranchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BranchDialogData,
  ) {
    this.isEditMode = data.isEditMode;
    this.branchForm = this.fb.group({
      branch_name: ['', [Validators.required, Validators.maxLength(100)]],
      location: ['', [Validators.required, Validators.maxLength(255)]],
      contact_number: ['', Validators.maxLength(20)],
      status: ['active'],
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.branch) {
      this.branchForm.patchValue(this.data.branch);
    }
  }

  onSubmit(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const branchData = this.branchForm.value;

    console.log('Saving branch - Edit Mode:', this.isEditMode);
    console.log('Branch ID:', this.data.branch?.branch_id);
    console.log('Branch Data:', branchData);

    const operation =
      this.isEditMode && this.data.branch?.branch_id
        ? this.branchService.updateBranch(
            this.data.branch.branch_id,
            branchData as BranchUpdateRequest,
          )
        : this.branchService.createBranch(branchData as BranchCreateRequest);

    operation.subscribe({
      next: (result) => {
        console.log('Branch save SUCCESS:', result);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Branch ${this.isEditMode ? 'updated' : 'created'} successfully`,
          timer: 2000,
          showConfirmButton: false,
        });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Branch save FAILED - Full error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: `Failed to ${this.isEditMode ? 'update' : 'create'} branch: ${error.error?.message || error.message || 'Unknown error'}`,
        });
        this.isSaving = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.branchForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['maxLength'])
      return `Maximum length is ${control.errors['maxLength'].requiredLength}`;

    return 'Invalid value';
  }
}
