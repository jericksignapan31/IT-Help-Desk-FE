import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
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

@Component({
  selector: 'app-brand-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './brand-form.component.html',
  styleUrls: ['./brand-form.component.scss'],
})
export class BrandFormComponent implements OnInit {
  brandForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  brandId: string | number | null = null;

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
  ) {
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
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.brandId = id;
        this.loadBrand(id);
      }
    });
  }

  loadBrand(id: string | number): void {
    this.isLoading = true;
    this.brandService.getBrandById(id).subscribe({
      next: (brand) => {
        this.brandForm.patchValue(brand);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading brand:', error);
        this.snackBar.open('Failed to load brand', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/brands']);
      },
    });
  }

  onSubmit(): void {
    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const brandData = this.brandForm.value;

    const operation =
      this.isEditMode && this.brandId
        ? this.brandService.updateBrand(
            this.brandId,
            brandData as BrandUpdateRequest,
          )
        : this.brandService.createBrand(brandData as BrandCreateRequest);

    operation.subscribe({
      next: () => {
        this.snackBar.open(
          `Brand ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 },
        );
        this.router.navigate(['/brands']);
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

  cancel(): void {
    this.router.navigate(['/brands']);
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
