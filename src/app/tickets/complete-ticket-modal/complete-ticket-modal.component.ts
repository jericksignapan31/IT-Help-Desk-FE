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

export interface CompleteTicketDialogData {
  ticketId: string;
  ticketStatus: string; // 'in_progress' or 'hold'
  allPartsReceived?: boolean; // for hold status tickets
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
    <h2 mat-dialog-title>
      {{ isHoldStatus() ? 'Mark Ticket as Resolved' : 'Complete Ticket' }}
    </h2>
    <mat-dialog-content>
      <!-- Warning for hold status -->
      <div *ngIf="isHoldStatus() && !allPartsReceived" class="warning-banner">
        <mat-icon class="warning-icon">warning</mat-icon>
        <div>
          <strong>⚠️ Parts Not Received</strong>
          <p>All parts must be marked as received before completing this ticket.</p>
          <p>Close this dialog and mark parts as received from the Parts tab.</p>
        </div>
      </div>

      <!-- Parts status for hold tickets -->
      <div *ngIf="isHoldStatus()" class="parts-received-banner">
        <mat-icon class="check-icon">check_circle</mat-icon>
        <div>
          <strong>✅ All Parts Received</strong>
          <p>You can now complete this ticket.</p>
        </div>
      </div>

      <form [formGroup]="completeForm" class="complete-form">
        <!-- Unit Status Dropdown -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Unit Status *</mat-label>
          <mat-select formControlName="unit_status">
            <mat-option value="working">✅ Working</mat-option>
            <mat-option value="not_working">❌ Not Working</mat-option>
            <mat-option value="partially_working">⚠️ Partially Working</mat-option>
            <!-- Only show need_buy_parts option for in_progress tickets -->
            <mat-option *ngIf="!isHoldStatus()" value="need_buy_parts" class="option-parts">
              🛒 Need to Buy Parts
            </mat-option>
          </mat-select>
          <mat-hint *ngIf="!isHoldStatus() && isNeedBuyParts()">
            Ticket will be put on hold until parts arrive
          </mat-hint>
          <mat-hint *ngIf="isHoldStatus()">
            Select the final unit status after parts installation
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
        [disabled]="!completeForm.valid || (isHoldStatus() && !allPartsReceived)"
      >
        <mat-icon>
          {{ isHoldStatus() ? 'check_circle' : isNeedBuyParts() ? 'shopping_cart' : 'check_circle' }}
        </mat-icon>
        {{ isHoldStatus() ? 'Mark as Resolved' : isNeedBuyParts() ? 'Request Parts' : 'Complete Ticket' }}
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

    .warning-banner,
    .parts-received-banner {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      align-items: flex-start;
    }

    .warning-banner {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
    }

    .warning-banner strong,
    .parts-received-banner strong {
      display: block;
      margin-bottom: 0.5rem;
    }

    .warning-banner p,
    .parts-received-banner p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
    }

    .parts-received-banner {
      background-color: #d4edda;
      border: 1px solid #28a745;
      color: #155724;
    }

    .warning-icon,
    .check-icon {
      font-size: 1.5rem;
      height: 1.5rem;
      width: 1.5rem;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .warning-icon {
      color: #ffc107;
    }

    .check-icon {
      color: #28a745;
    }
  `],
})
export class CompleteTicketModalComponent {
  completeForm: FormGroup;
  allPartsReceived = false;

  unitStatusOptions = [
    { value: 'working', label: 'Working' },
    { value: 'not_working', label: 'Not Working' },
    { value: 'partially_working', label: 'Partially Working' },
    { value: 'need_buy_parts', label: '⚠️ Need to Buy Parts' },
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CompleteTicketModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompleteTicketDialogData
  ) {
    // For hold status tickets, don't offer need_buy_parts option
    const initialStatus = data?.ticketStatus === 'hold' ? 'working' : 'working';
    
    this.completeForm = this.fb.group({
      unit_status: [initialStatus, Validators.required],
      observation: ['', Validators.required],
      action_taken: ['', Validators.required],
      recommendation: [''],
      resolution_notes: [''],
    });

    // Set if all parts are received for this ticket
    this.allPartsReceived = data?.allPartsReceived ?? false;
  }

  isHoldStatus(): boolean {
    return this.data?.ticketStatus === 'hold';
  }

  isNeedBuyParts(): boolean {
    return this.completeForm.get('unit_status')?.value === 'need_buy_parts';
  }

  onSubmit(): void {
    if (!this.completeForm.valid) {
      return;
    }

    // Validation: if ticket is on hold, ensure unit_status is NOT need_buy_parts
    if (this.isHoldStatus()) {
      if (this.isNeedBuyParts()) {
        console.error('❌ Cannot set need_buy_parts on hold ticket');
        return;
      }
      if (!this.allPartsReceived) {
        console.error('❌ All parts must be received before completing');
        return;
      }
    }

    const formData = this.completeForm.value;
    
    // Only send what backend expects - it determines status based on unit_status
    const completedData = {
      unit_status: formData.unit_status,
      observation: formData.observation,
      action_taken: formData.action_taken,
      recommendation: formData.recommendation,
      resolution_notes: formData.resolution_notes,
    };
    
    console.log('📋 Complete ticket data (backend will determine status):', {
      currentStatus: this.data?.ticketStatus,
      unit_status: completedData.unit_status,
      allPartsReceived: this.allPartsReceived,
    });
    
    this.dialogRef.close(completedData);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
