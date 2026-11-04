import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Message } from '../../../models/chat.model';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './user-message.component.html',
  styleUrls: ['./user-message.component.scss'],
})
export class UserMessageComponent {
  @Input() message!: Message;

  /**
   * Format timestamp
   */
  formatTime(date: Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
