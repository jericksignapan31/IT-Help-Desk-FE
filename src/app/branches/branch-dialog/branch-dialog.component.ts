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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BranchService } from '../../services/branch.service';
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
    MatSnackBarModule,
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
    private snackBar: MatSnackBar,
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

    const operation =
      this.isEditMode && this.data.branch?.id
        ? this.branchService.updateBranch(
            this.data.branch.id,
            branchData as BranchUpdateRequest,
          )
        : this.branchService.createBranch(branchData as BranchCreateRequest);

    operation.subscribe({
      next: (result) => {
        this.snackBar.open(
          `Branch ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 },
        );
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error saving branch:', error);
        this.snackBar.open(
          `Failed to ${this.isEditMode ? 'update' : 'create'} branch`,
          'Close',
          { duration: 3000 },
        );
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
