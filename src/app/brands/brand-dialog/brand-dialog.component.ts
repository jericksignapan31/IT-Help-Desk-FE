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
import { BrandService } from '../../services/brand.service';
import Swal from 'sweetalert2';
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
    public dialogRef: MatDialogRef<BrandDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BrandDialogData,
  ) {
    console.log('BrandDialogComponent constructor called with data:', data);
    this.isEditMode = data.isEditMode;
    this.brandForm = this.fb.group({
      brand_name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      brand_image_url: [
        '',
        [Validators.maxLength(500), Validators.pattern('https?://.+')],
      ],
      status: [true],
    });
    console.log('Brand form initialized:', this.brandForm.value);
  }

  ngOnInit(): void {
    console.log('BrandDialogComponent ngOnInit, isEditMode:', this.isEditMode);
    if (this.isEditMode && this.data.brand) {
      console.log('Patching form with brand data:', this.data.brand);
      this.brandForm.patchValue(this.data.brand);
      console.log('Form after patch:', this.brandForm.value);
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
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Brand ${this.isEditMode ? 'updated' : 'created'} successfully`,
          timer: 2000,
          showConfirmButton: false,
        });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error saving brand:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: `Failed to ${this.isEditMode ? 'update' : 'create'} brand`,
        });
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
