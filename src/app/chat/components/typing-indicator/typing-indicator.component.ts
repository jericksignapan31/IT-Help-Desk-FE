import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="typingUsers.length > 0" class="typing-container">
      <span class="typing-text">
        {{ getTypingText() }}
      </span>
      <span class="dots">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .typing-container {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 16px;
        background-color: #f0f0f0;
        border-radius: 0;
        font-size: 13px;
        color: #666;
        flex-shrink: 0;
      }

      .typing-text {
        font-weight: 500;
      }

      .dots {
        display: flex;
        gap: 2px;
      }

      .dots span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: #666;
        animation: bounce 1.4s ease-in-out infinite;
      }

      .dots span:nth-child(1) {
        animation-delay: -0.32s;
      }

      .dots span:nth-child(2) {
        animation-delay: -0.16s;
      }

      @keyframes bounce {
        0%,
        80%,
        100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `,
  ],
})
export class TypingIndicatorComponent {
  @Input() typingUsers: string[] = [];

  getTypingText(): string {
    if (this.typingUsers.length === 1) {
      return `${this.typingUsers[0]} is typing`;
    } else if (this.typingUsers.length === 2) {
      return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing`;
    } else {
      return `${this.typingUsers.length} people are typing`;
    }
  }
}
