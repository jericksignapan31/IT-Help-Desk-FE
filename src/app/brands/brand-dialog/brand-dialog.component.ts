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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrandService } from '../../services/brand.service';
import {
  Brand,
  BrandCreateRequest,
  BrandUpdateRequest,
} from '../../models/brand.model';

export interface BrandDialogData {
  brand?: Brand;
  isEditMode: boolean;
}

@Component({
  selector: 'app-brand-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './brand-dialog.component.html',
  styleUrls: ['./brand-dialog.component.scss'],
})
export class BrandDialogComponent implements OnInit {
  brandForm: FormGroup;
  isEditMode = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<BrandDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BrandDialogData,
  ) {
    this.isEditMode = data.isEditMode;
    this.brandForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      manufacturer: ['', Validators.maxLength(100)],
      description: ['', Validators.maxLength(500)],
      website_url: [
        '',
        [Validators.maxLength(255), Validators.pattern('https?://.+')],
      ],
      support_email: ['', [Validators.email, Validators.maxLength(100)]],
      support_phone: ['', Validators.maxLength(20)],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.brand) {
      this.brandForm.patchValue(this.data.brand);
    }
  }

  onSubmit(): void {
    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const brandData = this.brandForm.value;

    const operation =
      this.isEditMode && this.data.brand?.id
        ? this.brandService.updateBrand(
            this.data.brand.id,
            brandData as BrandUpdateRequest,
          )
        : this.brandService.createBrand(brandData as BrandCreateRequest);

    operation.subscribe({
      next: (result) => {
        this.snackBar.open(
          `Brand ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 },
        );
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error saving brand:', error);
        this.snackBar.open(
          `Failed to ${this.isEditMode ? 'update' : 'create'} brand`,
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
    const control = this.brandForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['maxLength'])
      return `Maximum length is ${control.errors['maxLength'].requiredLength}`;
    if (control.errors['pattern']) return 'Invalid URL format';
    if (control.errors['email']) return 'Invalid email format';

    return 'Invalid value';
  }
}
