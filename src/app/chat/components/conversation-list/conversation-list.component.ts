import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Conversation } from '../../models';
import { UnreadBadgeComponent } from '../unread-badge/unread-badge.component';
import { OnlineStatusComponent } from '../online-status/online-status.component';
import { ChatSocketService } from '../../services/chat-socket.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    UnreadBadgeComponent,
    OnlineStatusComponent,
  ],
  template: `
    <div class="conversation-list-container">
      <div class="list-header">
        <h2>Chats</h2>
        <button mat-icon-button (click)="onCreateNew()" title="New Chat">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search</mat-label>
        <input matInput [(ngModel)]="searchText" placeholder="Search conversations..." />
        <button mat-icon-button matSuffix (click)="searchText = ''" *ngIf="searchText">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="30"></mat-spinner>
      </div>

      <div *ngIf="!loading && filteredConversations.length === 0" class="empty-state">
        <mat-icon>chat_bubble_outline</mat-icon>
        <p>No conversations yet</p>
      </div>

      <mat-list class="conversations" *ngIf="!loading">
        <mat-list-item
          *ngFor="let conversation of filteredConversations"
          class="conversation-item"
          [class.active]="isActive(conversation)"
          (click)="onSelectConversation(conversation)"
        >
          <div class="conversation-content">
            <div class="conversation-header">
              <div class="conversation-name-wrapper">
                <span class="conversation-name">
                  {{ getConversationName(conversation) }}
                </span>
                <app-online-status 
                  *ngIf="conversation.type === 'DIRECT'"
                  [isOnline]="isUserOnline(conversation)"
                ></app-online-status>
              </div>
              <app-unread-badge [count]="conversation.unread_count || 0"></app-unread-badge>
            </div>
            <div class="conversation-preview">
              {{ conversation.last_message || 'No messages yet' }}
            </div>
          </div>
          <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="onDeleteConversation(conversation)">
              <mat-icon>delete</mat-icon>
              <span>Delete</span>
            </button>
          </mat-menu>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  styles: [
    `
      .conversation-list-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background-color: #fff;
        border-right: 1px solid #e5e5e5;
        overflow: hidden;
      }

      .list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #e5e5e5;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        flex-shrink: 0;
      }

      .list-header h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        color: #fff;
      }

      .list-header button {
        color: #fff !important;
      }

      .search-field {
        width: calc(100% - 16px);
        margin: 3px 8px;
      }

      .search-field ::ng-deep {
        .mdc-text-field {
          background-color: #f0f0f0 !important;
          border-radius: 16px !important;
        }
        
        .mdc-text-field__input {
          border-radius: 16px;
          padding: 2px 6px !important;
          font-size: 11px !important;
          min-height: 24px !important;
          line-height: 1.2 !important;
        }

        .mat-mdc-form-field-label {
          font-size: 10px !important;
        }

        .mat-mdc-form-field-hint-wrapper {
          display: none;
        }

        mat-icon {
          width: 14px !important;
          height: 14px !important;
          font-size: 14px !important;
        }

        .mdc-notched-outline__leading {
          border-radius: 16px 0 0 16px;
        }

        .mdc-notched-outline__trailing {
          border-radius: 0 16px 16px 0;
        }
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
        color: #999;
        min-height: 0;
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ddd;
        margin-bottom: 12px;
      }

      .empty-state p {
        margin: 0;
        font-size: 14px;
      }

      .conversations {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 0;
        scrollbar-width: thin;
        scrollbar-color: #ccc transparent;
        min-height: 0;
      }

      .conversations::-webkit-scrollbar {
        width: 6px;
      }

      .conversations::-webkit-scrollbar-track {
        background: transparent;
      }

      .conversations::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
      }

      .conversations::-webkit-scrollbar-thumb:hover {
        background: #999;
      }

      .conversation-item {
        display: flex;
        align-items: center;
        padding: 10px 12px !important;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: all 0.2s ease;
        height: auto !important;
        background-color: #fff;
      }

      .conversation-item:hover {
        background-color: #f5f5f5;
      }

      .conversation-item.active {
        background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
        border-left: 4px solid #667eea;
        padding-left: 8px !important;
        box-shadow: inset 0 0 10px rgba(102, 126, 234, 0.1);
      }

      .conversation-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        min-width: 0;
      }

      .conversation-name {
        font-weight: 500;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #333;
      }

      .conversation-name-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        flex: 1;
      }

      .conversation-preview {
        font-size: 12px;
        color: #888;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0;
      }

      ::ng-deep .mat-mdc-list-item {
        height: auto;
      }

      ::ng-deep .mat-mdc-menu-content {
        padding: 0 !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent implements OnChanges {
  @Input() conversations: Conversation[] = [];
  @Input() currentConversation: Conversation | null = null;
  @Input() loading: boolean = false;
  @Output() selectConversation = new EventEmitter<Conversation>();
  @Output() deleteConversation = new EventEmitter<Conversation>();
  @Output() createNew = new EventEmitter<void>();

  searchText: string = '';
  private chatSocket = inject(ChatSocketService);
  onlineUsers$ = this.chatSocket.onlineUsers$;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversations'] || changes['currentConversation']) {
      this.cdr.markForCheck();
    }
  }

  get filteredConversations(): Conversation[] {
    return this.conversations.filter((conv) => {
      const name = this.getConversationName(conv).toLowerCase();
      return name.includes(this.searchText.toLowerCase());
    });
  }

  getConversationName(conversation: Conversation): string {
    if (conversation.name) {
      return conversation.name;
    }

    // For DIRECT conversations, show the other participant's name
    if (conversation.participants && conversation.participants.length > 0) {
      return conversation.participants.map((p) => p.first_name).join(', ');
    }

    return 'Unnamed Conversation';
  }

  isActive(conversation: Conversation): boolean {
    return this.currentConversation?.conversation_id === conversation.conversation_id;
  }

  isUserOnline(conversation: Conversation): boolean {
    if (!conversation.participants || conversation.participants.length === 0) {
      return false;
    }
    const onlineUsers = this.chatSocket.getOnlineUsers();
    // For DIRECT conversations, check if the other participant is online
    return conversation.participants.some((p) => onlineUsers.includes(p.id));
  }

  onSelectConversation(conversation: Conversation): void {
    this.selectConversation.emit(conversation);
  }

  onDeleteConversation(conversation: Conversation): void {
    if (confirm(`Delete conversation with ${this.getConversationName(conversation)}?`)) {
      this.deleteConversation.emit(conversation);
    }
  }

  onCreateNew(): void {
    this.createNew.emit();
  }
}
