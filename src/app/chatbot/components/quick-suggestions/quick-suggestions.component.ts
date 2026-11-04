import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { QuickReplyService, QuickReply } from '../../../services/quick-reply.service';

@Component({
  selector: 'app-quick-suggestions',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="quick-suggestions-container" *ngIf="suggestions.length > 0">
      <div class="suggestions-label">Quick suggestions:</div>
      <div class="suggestions-grid">
        <button
          mat-stroked-button
          *ngFor="let suggestion of suggestions"
          (click)="selectSuggestion(suggestion)"
          class="suggestion-button"
          [matTooltip]="suggestion.text"
        >
          <mat-icon>{{ suggestion.icon }}</mat-icon>
          <span>{{ suggestion.text }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .quick-suggestions-container {
        padding: 0.75rem;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        border-bottom: 1px solid #e5e7eb;

        .suggestions-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.5rem;

          .suggestion-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 6px 10px;
            font-size: 12px;
            height: 36px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            color: #374151;
            transition: all 0.2s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
              flex-shrink: 0;
            }

            &:hover {
              background: #2563eb;
              color: white;
              border-color: #2563eb;
              box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
            }

            &:active {
              transform: scale(0.95);
            }
          }
        }
      }

      @media (max-width: 480px) {
        .quick-suggestions-container {
          padding: 0.5rem;

          .suggestions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      }
    `,
  ],
})
export class QuickSuggestionsComponent implements OnInit, OnDestroy {
  @Output() suggestionSelected = new EventEmitter<string>();

  suggestions: QuickReply[] = [];
  private destroy$ = new Subject<void>();

  constructor(private quickReplyService: QuickReplyService) {}

  ngOnInit(): void {
    // Load initial quick replies
    this.suggestions = this.quickReplyService.getQuickReplies().slice(0, 4);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle suggestion selection
   */
  selectSuggestion(suggestion: QuickReply): void {
    this.suggestionSelected.emit(suggestion.text);
  }
}
