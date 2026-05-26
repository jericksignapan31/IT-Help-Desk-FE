import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CreatePartRequest, TicketPart } from '../../models/ticket-part.model';

@Component({
  selector: 'app-parts-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Request Parts</h2>
    <mat-dialog-content>
      <form [formGroup]="partForm" class="parts-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Part Name</mat-label>
          <input matInput formControlName="part_name" placeholder="e.g., Keyboard, RAM">
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Quantity</mat-label>
            <input matInput type="number" formControlName="quantity" min="1">
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Unit Cost</mat-label>
            <input matInput type="number" formControlName="unit_cost" min="0" step="0.01">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Supplier</mat-label>
          <input matInput formControlName="supplier" placeholder="e.g., Lazada, Local Computer Store">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>

        <div class="total-cost">
          <strong>Total Cost: ₱{{ totalCost | number: '1.2-2' }}</strong>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!partForm.valid">
        <mat-icon>add</mat-icon>
        Request Parts
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .parts-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 400px;
    }

    .full-width {
      width: 100%;
    }

    .row {
      display: flex;
      gap: 1rem;
    }

    .half-width {
      flex: 1;
    }

    .total-cost {
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 4px;
      text-align: right;
      margin-top: 1rem;
    }

    mat-dialog-actions {
      gap: 0.5rem;
    }
  `],
})
export class PartsDialogComponent {
  partForm: FormGroup;
  totalCost: number = 0;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PartsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: string | number; existingPart?: TicketPart }
  ) {
    this.partForm = this.fb.group({
      part_name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_cost: [0, [Validators.required, Validators.min(0.01)]],
      supplier: ['', Validators.required],
      notes: [''],
    });

    this.partForm.get('quantity')?.valueChanges.subscribe(() => this.updateTotal());
    this.partForm.get('unit_cost')?.valueChanges.subscribe(() => this.updateTotal());
  }

  updateTotal(): void {
    const qty = this.partForm.get('quantity')?.value || 0;
    const cost = this.partForm.get('unit_cost')?.value || 0;
    this.totalCost = qty * cost;
  }

  onSubmit(): void {
    if (this.partForm.valid) {
      this.dialogRef.close(this.partForm.value as CreatePartRequest);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
