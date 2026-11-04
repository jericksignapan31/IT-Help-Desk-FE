import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Message } from '../../../models/chat.model';
import { UserMessageComponent } from '../user-message/user-message.component';
import { BotMessageComponent } from '../bot-message/bot-message.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UserMessageComponent,
    BotMessageComponent,
    TypingIndicatorComponent,
  ],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss'],
})
export class MessageListComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  @Input() messages: Message[] = [];
  @Input() loading: boolean = false;
  @Output() actionClick = new EventEmitter<string>();
  @Output() feedbackClick = new EventEmitter<Message>();

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  /**
   * Track by message ID for ngFor optimization
   */
  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Request scroll on next view check
   */
  requestScroll(): void {
    this.shouldScroll = true;
  }

  /**
   * Handle action button click from bot message
   */
  onActionClick(actionType: string): void {
    this.actionClick.emit(actionType);
  }

  /**
   * Handle feedback button click from bot message
   */
  onFeedbackClick(message: Message): void {
    this.feedbackClick.emit(message);
  }
}
