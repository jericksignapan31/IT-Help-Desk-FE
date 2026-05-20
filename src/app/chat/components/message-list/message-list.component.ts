import { Component, Input, Output, EventEmitter, ViewChild, AfterViewChecked, SimpleChanges, OnChanges, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Message } from '../../models';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="message-list-container">
      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="30"></mat-spinner>
      </div>

      <div *ngIf="!loading && messages.length === 0" class="empty-state">
        <mat-icon>chat_bubble_outline</mat-icon>
        <p>No messages yet. Start the conversation!</p>
      </div>

      <div class="messages" #messagesContainer>
        <div *ngFor="let message of messages; let i = index" class="message-group">
          <div
            class="message"
            [class.own-message]="isOwnMessage(message)"
            [class.other-message]="!isOwnMessage(message)"
          >
            <!-- Avatar for other messages -->
            <div *ngIf="!isOwnMessage(message)" class="message-avatar">
              <img
                *ngIf="message.sender?.avatar"
                [src]="message.sender?.avatar || ''"
                [alt]="message.sender?.first_name || ''"
                class="avatar-image"
              />
              <div *ngIf="!message.sender?.avatar" class="avatar-placeholder">
                {{ (message.sender?.first_name || 'U')[0].toUpperCase() }}
              </div>
            </div>

            <div class="message-content">
              <div *ngIf="!isOwnMessage(message) && showSenderName(message, i)" class="sender-name">
                {{ message.sender?.first_name || 'Unknown User' }}
              </div>
              <div class="message-text">{{ message.content }}</div>
              <div class="message-footer">
                <span class="timestamp">{{ formatTime(message.created_at) }}</span>
                <span *ngIf="isOwnMessage(message)" class="read-receipt" [class.read]="message.is_read">
                  <mat-icon>{{ message.is_read ? 'done_all' : 'done' }}</mat-icon>
                </span>
              </div>
            </div>

            <!-- Avatar for own messages -->
            <div *ngIf="isOwnMessage(message)" class="message-avatar">
              <div class="avatar-placeholder own">
                Me
              </div>
            </div>

            <button mat-icon-button [matMenuTriggerFor]="menu" class="message-menu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="onDeleteMessage(message)">
                <mat-icon>delete</mat-icon>
                <span>Delete</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      .message-list-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: linear-gradient(180deg, #fff 0%, #f8f9fa 100%);
        overflow: hidden;
        min-height: 0;
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        min-height: 0;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        width: 100%;
        color: #999;
        padding: 20px;
        min-height: 0;
      }

      .empty-state mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #ddd;
        margin-bottom: 16px;
      }

      .empty-state p {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
      }

      .messages {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        scrollbar-width: thin;
        scrollbar-color: #ccc transparent;
        min-height: 0;
      }

      .messages::-webkit-scrollbar {
        width: 6px;
      }

      .messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .messages::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
      }

      .messages::-webkit-scrollbar-thumb:hover {
        background: #999;
      }

      .message-group {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .message {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        max-width: 65%;
      }

      .message.own-message {
        align-self: flex-end;
        flex-direction: row-reverse;
      }

      .message.own-message .message-content {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-bottom-right-radius: 4px;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
      }

      .message.other-message {
        align-self: flex-start;
      }

      .message.other-message .message-content {
        background-color: #e8eaed;
        color: #333;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }

      .message-avatar {
        display: flex;
        align-items: flex-end;
        width: 28px;
        height: 28px;
        flex-shrink: 0;
      }

      .avatar-image {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .avatar-placeholder {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .avatar-placeholder.own {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      .message-content {
        padding: 8px 12px;
        border-radius: 18px;
        word-wrap: break-word;
        word-break: break-word;
        overflow-wrap: break-word;
      }

      .sender-name {
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 3px;
        opacity: 0.85;
        color: #555;
      }

      .message-text {
        font-size: 14px;
        line-height: 1.35;
        margin: 0;
      }

      .message-footer {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 3px;
        font-size: 11px;
        opacity: 0.65;
      }

      .timestamp {
        font-size: 11px;
      }

      .read-receipt mat-icon {
        font-size: 11px;
        width: 11px;
        height: 11px;
      }

      .read-receipt.read mat-icon {
        color: #4dd0e1;
      }

      .message-menu {
        visibility: hidden;
        width: 28px;
        height: 28px;
        opacity: 0.6;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }

      .message-menu:hover {
        opacity: 1;
      }

      .message:hover .message-menu {
        visibility: visible;
      }

      ::ng-deep .mat-mdc-menu-content {
        padding: 0 !important;
      }

      @media (max-width: 768px) {
        .message {
          max-width: 75%;
        }

        .messages {
          padding: 12px;
          gap: 6px;
        }
      }

      @media (max-width: 480px) {
        .message {
          max-width: 85%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input() messages: Message[] = [];
  @Input() currentUserId: string = '';
  @Input() loading: boolean = false;
  @Output() deleteMessage = new EventEmitter<Message>();
  @ViewChild('messagesContainer') messagesContainer: any;

  private shouldScroll = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages'] && !changes['messages'].firstChange) {
      this.shouldScroll = true;
      this.cdr.markForCheck();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  isOwnMessage(message: Message): boolean {
    return message.sender_id === this.currentUserId;
  }

  showSenderName(message: Message, index: number): boolean {
    if (index === 0) return true;
    const previousMessage = this.messages[index - 1];
    return previousMessage.sender_id !== message.sender_id;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  onDeleteMessage(message: Message): void {
    if (confirm('Delete this message?')) {
      this.deleteMessage.emit(message);
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }
}
