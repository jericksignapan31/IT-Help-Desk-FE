import { Component, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { WarehouseService, CreatePartRequestDto } from '../../services/warehouse.service';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-request-parts-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './request-parts-form.component.html',
  styleUrls: ['./request-parts-form.component.scss'],
})
export class RequestPartsFormComponent implements OnDestroy {
  @Output() submitSuccess = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private warehouseService: WarehouseService) {
    this.form = this.fb.group({
      part_name: ['', [Validators.required, Validators.minLength(1)]],
      quantity: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      unit_cost: ['', [Validators.required, Validators.min(0.01)]],
      supplier: ['', [Validators.required, Validators.minLength(1)]],
      notes: [''],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalCost(): number {
    const quantity = this.form.get('quantity')?.value || 0;
    const unitCost = this.form.get('unit_cost')?.value || 0;
    return quantity * unitCost;
  }

  formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `₱${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  submit(): void {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly',
      });
      return;
    }

    this.loading = true;
    const data: CreatePartRequestDto = this.form.value;

    this.warehouseService
      .createPartRequest(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: '✓ Part request submitted successfully',
            timer: 2000,
            showConfirmButton: false,
          });
          this.form.reset();
          this.loading = false;
          this.submitSuccess.emit();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Failed to submit part request',
          });
          this.loading = false;
        },
      });
  }

  reset(): void {
    this.form.reset();
  }

  isFormInvalid(): boolean {
    return this.form.invalid || this.loading;
  }
}
