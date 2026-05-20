import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
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
              <span class="conversation-name">
                {{ getConversationName(conversation) }}
              </span>
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
        background-color: #fff;
        border-right: 1px solid #e0e0e0;
        overflow: hidden;
      }

      .list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #e0e0e0;
      }

      .list-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      .search-field {
        width: calc(100% - 32px);
        margin: 8px 16px;
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        color: #999;
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ccc;
        margin-bottom: 12px;
      }

      .empty-state p {
        margin: 0;
        font-size: 14px;
      }

      .conversations {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }

      .conversation-item {
        display: flex;
        align-items: center;
        padding: 12px 16px !important;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .conversation-item:hover {
        background-color: #f5f5f5;
      }

      .conversation-item.active {
        background-color: #e3f2fd;
        border-left: 4px solid #1976d2;
        padding-left: 12px !important;
      }

      .conversation-content {
        flex: 1;
        min-width: 0;
      }

      .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .conversation-name {
        font-weight: 500;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .conversation-preview {
        font-size: 12px;
        color: #999;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
export class ConversationListComponent {
  @Input() conversations: Conversation[] = [];
  @Input() currentConversation: Conversation | null = null;
  @Input() loading: boolean = false;
  @Output() selectConversation = new EventEmitter<Conversation>();
  @Output() deleteConversation = new EventEmitter<Conversation>();
  @Output() createNew = new EventEmitter<void>();

  searchText: string = '';

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
