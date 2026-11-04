import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Message } from '../../../models/chat.model';

@Component({
  selector: 'app-bot-message',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './bot-message.component.html',
  styleUrls: ['./bot-message.component.scss'],
})
export class BotMessageComponent {
  @Input() message!: Message;
  @Output() actionClick = new EventEmitter<string>();
  @Output() feedbackClick = new EventEmitter<void>();

  /**
   * Format timestamp
   */
  formatTime(date: Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Handle action button click
   */
  handleAction(actionType: string): void {
    this.actionClick.emit(actionType);
  }

  /**
   * Handle feedback button click
   */
  handleFeedback(): void {
    this.feedbackClick.emit();
  }
}
