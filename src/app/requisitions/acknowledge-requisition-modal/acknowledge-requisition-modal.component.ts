import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';
import { PartRequisition } from '../../models/requisition.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-acknowledge-requisition-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './acknowledge-requisition-modal.component.html',
  styleUrls: ['./acknowledge-requisition-modal.component.scss'],
})
export class AcknowledgeRequisitionModalComponent implements OnInit, OnDestroy {
  form: FormGroup;
  requisition: PartRequisition;
  departments: Department[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AcknowledgeRequisitionModalComponent>,
    private departmentService: DepartmentService,
    @Inject(MAT_DIALOG_DATA) public data: { requisition: PartRequisition },
  ) {
    this.requisition = data.requisition;
    this.form = this.fb.group({
      notes: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartments(): void {
    this.departmentService
      .getAllDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departments = data;
        },
        error: (err) => {
          console.error('Error loading departments:', err);
        },
      });
  }

  getDepartmentName(department: string | { department_id: string; department_name: string; description: string; is_active: boolean; created_at: string; updated_at: string; } | undefined): string {
    if (!department) return 'N/A';
    
    // If department is an object with department_name
    if (typeof department === 'object' && department.department_name) {
      return department.department_name;
    }
    
    // If department is a string (ID), look it up in the departments array
    if (typeof department === 'string') {
      const dept = this.departments.find((d) => d.department_id === department);
      return dept ? dept.department_name : department;
    }
    
    return 'N/A';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAcknowledge(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        notes: this.form.get('notes')?.value || '',
      });
    }
  }

  getItemsCount(): number {
    return this.requisition.items?.length || 0;
  }

  calculateTotalCost(): number {
    if (!this.requisition.items || this.requisition.items.length === 0) {
      return 0;
    }
    return this.requisition.items.reduce((sum, item) => {
      const cost = typeof item.total_cost === 'string'
        ? parseFloat(item.total_cost)
        : item.total_cost || 0;
      return sum + cost;
    }, 0);
  }

  formatCurrency(value: number): string {
    return `₱${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getUnitCostValue(cost: any): number {
    if (typeof cost === 'string') {
      return parseFloat(cost);
    }
    return cost || 0;
  }

  getTotalCostValue(cost: any): number {
    if (typeof cost === 'string') {
      return parseFloat(cost);
    }
    return cost || 0;
  }
}
