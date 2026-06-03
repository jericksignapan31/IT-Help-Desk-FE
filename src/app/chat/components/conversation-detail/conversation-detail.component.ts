import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Conversation, Message, FileAttachment } from '../../models';
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
        [currentConversationId]="conversation ? conversation.conversation_id : ''"
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
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      .conversation-detail-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background-color: #fff;
        overflow: hidden;
        min-height: 0;
      }

      .conversation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e5e5e5;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        flex-shrink: 0;
      }

      .header-content {
        flex: 1;
        min-width: 0;
      }

      .conversation-title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .conversation-subtitle {
        margin: 3px 0 0 0;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.85);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .header-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .header-actions button {
        color: #fff !important;
      }

      .no-conversation {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        flex: 1;
        color: #999;
        background: linear-gradient(135deg, #f5f7fa 0%, #f8f9fa 100%);
      }

      .no-conversation mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ddd;
        margin-bottom: 16px;
      }

      .no-conversation p {
        margin: 0;
        font-size: 15px;
        font-weight: 500;
      }

      ::ng-deep .mat-mdc-menu-content {
        padding: 0 !important;
      }

      ::ng-deep .mdc-divider {
        margin: 0 !important;
        border-color: #e5e5e5 !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationDetailComponent implements OnChanges {
  @Input() conversation: Conversation | null = null;
  @Input() messages: Message[] = [];
  @Input() typingUsers: string[] = [];
  @Input() currentUserId: string = '';
  @Input() loadingMessages: boolean = false;
  @Input() disabled: boolean = false;
  @Output() sendMessage = new EventEmitter<{ text: string; attachments?: FileAttachment[] }>();
  @Output() deleteMessage = new EventEmitter<Message>();
  @Output() typing = new EventEmitter<void>();
  @Output() stoppedTyping = new EventEmitter<void>();
  @Output() deleteConversation = new EventEmitter<Conversation>();
  @Output() info = new EventEmitter<Conversation>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages'] || changes['conversation'] || changes['typingUsers']) {
      this.cdr.markForCheck();
    }
  }

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

  onSendMessage(message: { text: string; attachments?: FileAttachment[] }): void {
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
