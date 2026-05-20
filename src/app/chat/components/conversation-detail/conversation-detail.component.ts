import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Conversation, Message } from '../../models';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-conversation-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MessageListComponent,
    MessageInputComponent,
    TypingIndicatorComponent,
  ],
  template: `
    <div class="conversation-detail-container" *ngIf="conversation; else noConversation">
      <!-- Header -->
      <div class="conversation-header">
        <div class="header-content">
          <h3 class="conversation-title">{{ getConversationTitle() }}</h3>
          <p class="conversation-subtitle">{{ getParticipantsList() }}</p>
        </div>
        <div class="header-actions">
          <button mat-icon-button (click)="onInfo()">
            <mat-icon>info</mat-icon>
          </button>
          <button mat-icon-button [matMenuTriggerFor]="menu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="onDelete()">
              <mat-icon>delete</mat-icon>
              <span>Delete Conversation</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Messages -->
      <app-message-list
        [messages]="messages"
        [currentUserId]="currentUserId"
        [loading]="loadingMessages"
        (deleteMessage)="onDeleteMessage($event)"
      ></app-message-list>

      <!-- Typing Indicator -->
      <app-typing-indicator [typingUsers]="typingUsers"></app-typing-indicator>

      <!-- Message Input -->
      <app-message-input
        [disabled]="disabled"
        (messageSent)="onSendMessage($event)"
        (typing)="onTyping()"
        (stoppedTyping)="onStoppedTyping()"
      ></app-message-input>
    </div>

    <ng-template #noConversation>
      <div class="no-conversation">
        <mat-icon>chat_bubble_outline</mat-icon>
        <p>Select a conversation to start chatting</p>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .conversation-detail-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #fff;
        overflow: hidden;
      }

      .conversation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
        background-color: #fafafa;
      }

      .header-content {
        flex: 1;
        min-width: 0;
      }

      .conversation-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .conversation-subtitle {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #999;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .header-actions {
        display: flex;
        gap: 4px;
      }

      .no-conversation {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #999;
      }

      .no-conversation mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      .no-conversation p {
        margin: 0;
        font-size: 16px;
      }

      ::ng-deep .mat-mdc-menu-content {
        padding: 0 !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationDetailComponent {
  @Input() conversation: Conversation | null = null;
  @Input() messages: Message[] = [];
  @Input() typingUsers: string[] = [];
  @Input() currentUserId: string = '';
  @Input() loadingMessages: boolean = false;
  @Input() disabled: boolean = false;
  @Output() sendMessage = new EventEmitter<string>();
  @Output() deleteMessage = new EventEmitter<Message>();
  @Output() typing = new EventEmitter<void>();
  @Output() stoppedTyping = new EventEmitter<void>();
  @Output() deleteConversation = new EventEmitter<Conversation>();
  @Output() info = new EventEmitter<Conversation>();

  getConversationTitle(): string {
    if (!this.conversation) return '';

    if (this.conversation.name) {
      return this.conversation.name;
    }

    if (this.conversation.participants && this.conversation.participants.length > 0) {
      return this.conversation.participants.map((p) => p.first_name).join(', ');
    }

    return 'Conversation';
  }

  getParticipantsList(): string {
    if (!this.conversation?.participants || this.conversation.participants.length === 0) {
      return '';
    }

    const names = this.conversation.participants.map((p) => p.first_name).join(', ');
    return `${this.conversation.participants.length} participant${this.conversation.participants.length !== 1 ? 's' : ''}`;
  }

  onSendMessage(message: string): void {
    this.sendMessage.emit(message);
  }

  onDeleteMessage(message: Message): void {
    this.deleteMessage.emit(message);
  }

  onTyping(): void {
    this.typing.emit();
  }

  onStoppedTyping(): void {
    this.stoppedTyping.emit();
  }

  onDelete(): void {
    if (this.conversation && confirm('Delete this conversation?')) {
      this.deleteConversation.emit(this.conversation);
    }
  }

  onInfo(): void {
    if (this.conversation) {
      this.info.emit(this.conversation);
    }
  }
}
