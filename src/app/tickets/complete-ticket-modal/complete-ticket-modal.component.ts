import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface CompleteTicketData {
  unit_status: string;
  observation: string;
  action_taken: string;
  recommendation?: string;
  resolution_notes?: string;
}

@Component({
  selector: 'app-complete-ticket-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Complete Ticket</h2>
    <mat-dialog-content>
      <form [formGroup]="completeForm" class="complete-form">
        <!-- Unit Status Dropdown -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Unit Status *</mat-label>
          <mat-select formControlName="unit_status">
            <mat-option value="working">Working</mat-option>
            <mat-option value="not_working">Not Working</mat-option>
            <mat-option value="partially_working">Partially Working</mat-option>
            <mat-option value="need_buy_parts" class="option-parts">
              ⚠️ Need to Buy Parts
            </mat-option>
          </mat-select>
          <mat-hint *ngIf="isNeedBuyParts()">
            Ticket will be put on hold until parts arrive
          </mat-hint>
        </mat-form-field>

        <!-- Observation -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observation *</mat-label>
          <textarea
            matInput
            formControlName="observation"
            rows="3"
            placeholder="What was observed about the issue..."
          ></textarea>
          <mat-hint>Describe what you found during diagnosis</mat-hint>
        </mat-form-field>

        <!-- Action Taken -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Action Taken *</mat-label>
          <textarea
            matInput
            formControlName="action_taken"
            rows="3"
            placeholder="What action was taken to fix the issue..."
          ></textarea>
          <mat-hint>Describe the steps taken for resolution</mat-hint>
        </mat-form-field>

        <!-- Recommendation (Optional) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Recommendation</mat-label>
          <textarea
            matInput
            formControlName="recommendation"
            rows="3"
            placeholder="Optional: Suggestions for future prevention..."
          ></textarea>
          <mat-hint>Optional field</mat-hint>
        </mat-form-field>

        <!-- Resolution Notes (Optional) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Additional Notes</mat-label>
          <textarea
            matInput
            formControlName="resolution_notes"
            rows="3"
            placeholder="Optional: Any additional notes..."
          ></textarea>
          <mat-hint>Optional field</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="!completeForm.valid"
      >
        <mat-icon>{{ isNeedBuyParts() ? 'shopping_cart' : 'check_circle' }}</mat-icon>
        {{ isNeedBuyParts() ? 'Request Parts' : 'Complete Ticket' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .complete-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 500px;
      padding-top: 1rem;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      width: 100%;
    }

    .option-parts {
      background-color: #fff3cd !important;
      color: #856404;
      font-weight: 500;
    }

    mat-dialog-actions {
      gap: 0.5rem;
      padding-top: 1rem;
    }

    mat-hint {
      font-size: 0.75rem;
      color: #666;
    }
  `],
})
export class CompleteTicketModalComponent {
  completeForm: FormGroup;

  unitStatusOptions = [
    { value: 'working', label: 'Working' },
    { value: 'not_working', label: 'Not Working' },
    { value: 'partially_working', label: 'Partially Working' },
    { value: 'need_buy_parts', label: '⚠️ Need to Buy Parts' },
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CompleteTicketModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.completeForm = this.fb.group({
      unit_status: ['working', Validators.required],
      observation: ['', Validators.required],
      action_taken: ['', Validators.required],
      recommendation: [''],
      resolution_notes: [''],
    });
  }

  isNeedBuyParts(): boolean {
    return this.completeForm.get('unit_status')?.value === 'need_buy_parts';
  }

  onSubmit(): void {
    if (this.completeForm.valid) {
      this.dialogRef.close(this.completeForm.value as CompleteTicketData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
