import { Component, OnDestroy, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WarehouseService } from '../../services/warehouse.service';
import { AuthService } from '../../services/auth.service';
import { DepartmentService } from '../../services/department.service';
import { User } from '../../models/user.model';
import { Department } from '../../models/department.model';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-create-requisition-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './create-requisition-form.component.html',
  styleUrls: ['./create-requisition-form.component.scss'],
})
export class CreateRequisitionFormComponent implements OnInit, OnDestroy {
  @Output() submitSuccess = new EventEmitter<string>(); // Emits RF number

  form: FormGroup;
  loading = false;
  minDate = new Date();
  currentUser: User | null = null;
  currentUserFullname = '';
  departments: Department[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private warehouseService: WarehouseService,
    private authService: AuthService,
    private departmentService: DepartmentService,
  ) {
    this.form = this.fb.group({
      department: [''],
      deadline: [''],
      items: this.fb.array([], Validators.required),
    });

    // Add first item row by default
    this.addItem();
  }

  ngOnInit(): void {
    // Get current user and extract fullname
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser?.employee) {
      const first = this.currentUser.employee.first_name || '';
      const middle = this.currentUser.employee.middle_name || '';
      const last = this.currentUser.employee.last_name || '';
      this.currentUserFullname = [first, middle, last]
        .filter((part) => part.trim().length > 0)
        .join(' ');
    }

    // Load all departments
    this.departmentService
      .getAllDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          this.departments = departments.filter((d) => d.is_active !== false);
        },
        error: (err) => {
          console.error('Error loading departments:', err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  getItemFormGroup(index: number): FormGroup {
    return this.items.at(index) as FormGroup;
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      item_name: ['', [Validators.required, Validators.minLength(1)]],
      quantity: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      unit: ['pcs', Validators.required],
      supplier: [''],
      unit_cost: [''],
      purpose_remarks: [''],
    });
    this.items.push(itemGroup);
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    } else {
      Swal.fire({
        icon: 'warning',
        text: 'At least one item is required',
      });
    }
  }

  calculateTotalCost(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const unitCost = item.get('unit_cost')?.value || 0;
    return quantity * unitCost;
  }

  getRequisitionTotal(): number {
    return this.items.controls.reduce((sum, item) => {
      const quantity = item.get('quantity')?.value || 0;
      const unitCost = item.get('unit_cost')?.value || 0;
      return sum + quantity * unitCost;
    }, 0);
  }

  formatCurrency(value: number): string {
    return `₱${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  submit(): void {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields',
      });
      return;
    }

    this.loading = true;
    const formData = this.form.value;
    
    // Automatically add current user info
    const data = {
      ...formData,
      requested_by: this.currentUserFullname,
      requested_by_id: this.currentUser?.employee_id || this.currentUser?.id,
    };

    this.warehouseService
      .createRequisition(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: `Requisition ${response.rf_number} created successfully`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.form.reset();
          this.items.clear();
          this.addItem();
          this.loading = false;
          this.submitSuccess.emit(response.rf_number);
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Failed to create requisition',
          });
          this.loading = false;
        },
      });
  }

  reset(): void {
    this.form.reset();
    this.items.clear();
    this.addItem();
  }

  isFormInvalid(): boolean {
    return this.form.invalid || this.loading;
  }
}
