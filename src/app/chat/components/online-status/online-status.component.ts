import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-online-status',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="online-status-container">
      <span 
        *ngIf="isOnline" 
        class="status-badge online"
        matTooltip="User is online"
        matTooltipPosition="above">
        <mat-icon>fiber_manual_record</mat-icon>
      </span>
      <span 
        *ngIf="!isOnline" 
        class="status-badge offline"
        matTooltip="User is offline"
        matTooltipPosition="above">
        <mat-icon>fiber_manual_record</mat-icon>
      </span>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .online-status-container {
        display: flex;
        align-items: center;
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .status-badge mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
        color: #999;
      }

      .status-badge.online mat-icon {
        color: #4caf50;
        animation: pulse 2s infinite;
      }

      .status-badge.offline mat-icon {
        color: #999;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `,
  ],
})
export class OnlineStatusComponent {
  @Input() isOnline: boolean = false;
}
