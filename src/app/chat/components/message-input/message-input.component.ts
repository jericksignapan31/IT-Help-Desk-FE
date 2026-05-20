import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="message-input-container">
      <mat-form-field appearance="outline" class="message-field">
        <mat-label>Type a message...</mat-label>
        <textarea
          matInput
          [(ngModel)]="messageText"
          (input)="onMessageInput()"
          (keydown.enter)="onKeydownEnter($event)"
          cdkTextareaAutosize
          cdkAutosizeMinRows="1"
          cdkAutosizeMaxRows="4"
          placeholder="Press Enter to send, Shift+Enter for new line"
        ></textarea>
      </mat-form-field>
      <button
        mat-icon-button
        (click)="onSendMessage()"
        [disabled]="!messageText.trim() || disabled"
        class="send-btn"
        [class.sending]="sending"
      >
        <mat-icon>{{ sending ? 'schedule' : 'send' }}</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .message-input-container {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
        border-top: 1px solid #e5e5e5;
        align-items: flex-end;
        box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.04);
      }

      .message-field {
        flex: 1;
      }

      .message-field ::ng-deep {
        .mdc-text-field {
          background-color: #fff !important;
          border-radius: 20px !important;
          border: 1px solid #e0e0e0 !important;
        }

        .mdc-text-field--focused {
          border-color: #667eea !important;
        }

        .mat-mdc-form-field-focus-overlay {
          background-color: transparent !important;
        }

        .mat-mdc-notched-outline__leading,
        .mat-mdc-notched-outline__trailing {
          border-radius: 20px !important;
        }

        textarea {
          padding: 10px 14px !important;
          border-radius: 20px;
          font-family: inherit;
          resize: none;
        }

        .mat-mdc-form-field-hint-wrapper {
          display: none;
        }
      }

      .send-btn {
        height: 40px;
        width: 40px;
        min-width: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
      }

      .send-btn:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #ccc !important;
        box-shadow: none;
      }

      .send-btn.sending {
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(0.95);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @media (max-width: 768px) {
        .message-input-container {
          padding: 10px 12px;
          gap: 6px;
        }

        .send-btn {
          height: 36px;
          width: 36px;
        }
      }
    `,
  ],
})
export class MessageInputComponent implements OnInit, OnDestroy {
  @Input() disabled: boolean = false;
  @Output() messageSent = new EventEmitter<string>();
  @Output() typing = new EventEmitter<void>();
  @Output() stoppedTyping = new EventEmitter<void>();

  messageText: string = '';
  sending: boolean = false;
  private destroy$ = new Subject<void>();
  private typingTimeout: any;
  private isTyping: boolean = false;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  onMessageInput(): void {
    if (!this.isTyping && this.messageText.trim()) {
      this.isTyping = true;
      this.typing.emit();
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      if (this.isTyping) {
        this.isTyping = false;
        this.stoppedTyping.emit();
      }
    }, 3000); // Stop typing indicator after 3 seconds of inactivity
  }

  onKeydownEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    this.onSendMessage(keyboardEvent);
  }

  onSendMessage(event?: KeyboardEvent): void {
    if (event) {
      // Check if it's Enter without Shift
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
      } else if (event.key === 'Enter' && event.shiftKey) {
        // Allow Shift+Enter for new line
        return;
      } else {
        return;
      }
    }

    const message = this.messageText.trim();
    if (!message || this.disabled) {
      return;
    }

    this.sending = true;
    this.isTyping = false;
    this.stoppedTyping.emit();

    // Emit message
    this.messageSent.emit(message);

    // Reset after a short delay
    setTimeout(() => {
      this.messageText = '';
      this.sending = false;
    }, 300);

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }
}
