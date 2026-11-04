import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface FeedbackModalData {
  interactionId: string;
  subject?: string; // E.g., "Answer to: How to reset password?"
}

export interface FeedbackModalResult {
  rating: number; // 1-5 stars
  isHelpful: boolean;
  comment: string;
}

@Component({
  selector: 'app-feedback-modal',
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
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.scss'],
})
export class FeedbackModalComponent {
  // Rating state
  rating = 0;
  hoveredRating = 0;

  // Feedback state
  isHelpful = true;
  comment = '';

  // UI state
  isSubmitting = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<FeedbackModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FeedbackModalData
  ) {}

  /**
   * Set rating when user clicks a star
   */
  setRating(value: number): void {
    this.rating = value;
    this.error = null;
  }

  /**
   * Set hovered rating for preview
   */
  setHovered(value: number): void {
    this.hoveredRating = value;
  }

  /**
   * Clear hover state
   */
  clearHovered(): void {
    this.hoveredRating = 0;
  }

  /**
   * Get current rating display (either hovered or selected)
   */
  getDisplayRating(): number {
    return this.hoveredRating || this.rating;
  }

  /**
   * Get star icon for rating
   */
  getStarIcon(index: number): string {
    const display = this.getDisplayRating();
    if (index <= display) {
      return 'star';
    }
    return 'star_outline';
  }

  /**
   * Toggle helpful/not helpful
   */
  toggleHelpful(): void {
    this.isHelpful = !this.isHelpful;
  }

  /**
   * Submit feedback
   */
  submit(): void {
    if (this.rating === 0) {
      this.error = 'Please select a rating';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const result: FeedbackModalResult = {
      rating: this.rating,
      isHelpful: this.isHelpful,
      comment: this.comment.trim(),
    };

    // Close dialog with result
    this.dialogRef.close(result);
  }

  /**
   * Cancel and close dialog
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get rating text
   */
  getRatingText(): string {
    switch (this.rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Select rating';
    }
  }
}
