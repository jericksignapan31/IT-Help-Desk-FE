import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PartRequisition } from '../../models/requisition.model';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-approve-requisition-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule,
  ],
  templateUrl: './approve-requisition-modal.component.html',
  styleUrls: ['./approve-requisition-modal.component.scss'],
})
export class ApproveRequisitionModalComponent implements OnInit, OnDestroy {
  form: FormGroup;
  requisition: PartRequisition;
  isRejecting: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ApproveRequisitionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { requisition: PartRequisition },
  ) {
    this.requisition = data.requisition;
    this.form = this.fb.group({
      rejection_reason: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getRequesterName(): string {
    if (!this.requisition.requester) return 'N/A';
    const { first_name, last_name } = this.requisition.requester;
    return [first_name, last_name].filter(Boolean).join(' ');
  }

  getAcknowledgerName(): string {
    if (!this.requisition.acknowledger) return 'Not yet acknowledged';
    const { first_name, last_name } = this.requisition.acknowledger;
    return [first_name, last_name].filter(Boolean).join(' ');
  }

  getItemsCount(): number {
    return this.requisition.items?.length || 0;
  }

  calculateTotalCost(): number {
    return this.requisition.items?.reduce((total, item) => {
      const itemTotal = typeof item.total_cost === 'string' 
        ? parseFloat(item.total_cost) 
        : item.total_cost;
      return total + (itemTotal || 0);
    }, 0) || 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  }

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  getUnitCostValue(cost: any): number {
    return typeof cost === 'string' ? parseFloat(cost) : cost || 0;
  }

  getTotalCostValue(cost: any): number {
    return typeof cost === 'string' ? parseFloat(cost) : cost || 0;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApprove(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        action: 'approved',
        rejection_reason: null,
      });
    }
  }

  onReject(): void {
    this.isRejecting = true;
    if (this.form.get('rejection_reason')?.value.trim()) {
      this.dialogRef.close({
        action: 'rejected',
        rejection_reason: this.form.get('rejection_reason')?.value,
      });
    }
  }

  toggleRejectMode(): void {
    this.isRejecting = !this.isRejecting;
    if (!this.isRejecting) {
      this.form.reset();
    }
  }
}
