import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unread-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span *ngIf="count > 0" class="badge">
      {{ count > 99 ? '99+' : count }}
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 10px;
        background-color: #f44336;
        color: white;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
      }
    `,
  ],
})
export class UnreadBadgeComponent {
  @Input() count: number = 0;
}
