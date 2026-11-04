import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Ticket, TicketCategory, TicketPriority } from '../../../models/ticket.model';

export interface TicketCreationData {
  conversationId?: string;
  title?: string;
  description?: string;
}

export interface TicketCreationResult {
  ticket_id: number;
  subject: string;
  ticket: Ticket;
}

@Component({
  selector: 'app-ticket-creation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './ticket-creation-dialog.component.html',
  styleUrls: ['./ticket-creation-dialog.component.scss'],
})
export class TicketCreationDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  showDescription = true;

  categories = Object.values(TicketCategory);
  priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  readonly maxSubjectLength = 200;
  readonly maxDescriptionLength = 1000;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TicketCreationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TicketCreationData,
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    // Pre-fill from conversation context
    if (this.data.title) {
      this.form.patchValue({ subject: this.data.title });
    }
    if (this.data.description) {
      this.form.patchValue({ description: this.data.description });
    }
  }

  /**
   * Create form with validation
   */
  private createForm(): FormGroup {
    return this.fb.group({
      subject: ['', [Validators.required, Validators.maxLength(this.maxSubjectLength)]],
      description: ['', [Validators.required, Validators.maxLength(this.maxDescriptionLength)]],
      category: ['other', Validators.required],
      priority: ['medium', Validators.required],
    });
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return this.form.valid && !this.loading;
  }

  /**
   * Get character count for subject
   */
  getSubjectCharCount(): number {
    return this.form.get('subject')?.value?.length || 0;
  }

  /**
   * Get character count for description
   */
  getDescriptionCharCount(): number {
    return this.form.get('description')?.value?.length || 0;
  }

  /**
   * Submit form
   */
  submit(): void {
    if (!this.form.valid) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = null;

    // Close dialog and return form data
    // Parent component will handle ticket creation
    this.dialogRef.close({
      subject: this.form.get('subject')?.value,
      description: this.form.get('description')?.value,
      category: this.form.get('category')?.value,
      priority: this.form.get('priority')?.value,
      conversationId: this.data.conversationId,
    });
  }

  /**
   * Cancel dialog
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control?.hasError('maxlength')) {
      const max = fieldName === 'subject' ? this.maxSubjectLength : this.maxDescriptionLength;
      return `Maximum ${max} characters allowed`;
    }
    return '';
  }
}
