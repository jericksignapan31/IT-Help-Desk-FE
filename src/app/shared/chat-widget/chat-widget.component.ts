import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatApiService } from '../../chat/services/chat-api.service';
import { ChatStoreService } from '../../chat/store/chat-store.service';
import { Conversation } from '../../chat/models';
import { UnreadBadgeComponent } from '../../chat/components/unread-badge/unread-badge.component';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatListModule,
    UnreadBadgeComponent,
  ],
  template: `
    <mat-card class="chat-widget">
      <mat-card-header>
        <mat-card-title>
          <div class="header-content">
            <span>Recent Chats</span>
            <button mat-icon-button routerLink="/chat" title="View All Chats">
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="loading" class="loading">
          <mat-icon>hourglass_empty</mat-icon>
          <p>Loading conversations...</p>
        </div>

        <div *ngIf="!loading && conversations.length === 0" class="empty-state">
          <mat-icon>chat_bubble_outline</mat-icon>
          <p>No conversations yet</p>
          <button mat-raised-button color="primary" routerLink="/chat">
            <mat-icon>chat</mat-icon>
            Start Chat
          </button>
        </div>

        <mat-list *ngIf="!loading && conversations.length > 0" class="conversations-list">
          <mat-list-item
            *ngFor="let conv of conversations.slice(0, 5)"
            class="conversation-item"
            [routerLink]="['/chat']"
          >
            <div class="conversation-content">
              <div class="conversation-header">
                <span class="conversation-name">{{ getConversationName(conv) }}</span>
                <app-unread-badge [count]="conv.unread_count || 0"></app-unread-badge>
              </div>
              <div class="conversation-preview">
                {{ conv.last_message || 'No messages yet' }}
              </div>
              <div class="conversation-time">
                {{ formatTime(conv.last_message_at || conv.updated_at) }}
              </div>
            </div>
          </mat-list-item>

          <button
            *ngIf="conversations.length > 5"
            mat-button
            routerLink="/chat"
            class="view-all-btn"
          >
            View all {{ conversations.length }} conversations
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </mat-list>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .chat-widget {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
      }

      .chat-widget mat-card-header {
        background-color: rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .chat-widget mat-card-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .header-content button {
        color: white !important;
      }

      mat-card-content {
        padding: 0;
      }

      .loading,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        text-align: center;
        color: rgba(255, 255, 255, 0.8);
      }

      .loading mat-icon,
      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 12px;
      }

      .empty-state button {
        margin-top: 12px;
      }

      .conversations-list {
        padding: 0;
      }

      .conversation-item {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: background-color 0.2s;
        color: white;
        padding: 12px 16px !important;
        height: auto;
      }

      .conversation-item:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .conversation-item:last-child {
        border-bottom: none;
      }

      .conversation-content {
        width: 100%;
      }

      .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        gap: 8px;
      }

      .conversation-name {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 14px;
      }

      .conversation-preview {
        font-size: 12px;
        opacity: 0.9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }

      .conversation-time {
        font-size: 11px;
        opacity: 0.7;
      }

      .view-all-btn {
        width: 100%;
        color: white;
        font-weight: 500;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0;
        justify-content: center;
      }

      .view-all-btn:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      ::ng-deep .mat-mdc-list-item {
        height: auto !important;
      }

      ::ng-deep .mat-mdc-card-header {
        padding: 12px 16px;
      }

      ::ng-deep .mat-mdc-card-content {
        padding: 0 !important;
      }
    `,
  ],
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  private chatApi = inject(ChatApiService);
  private chatStore = inject(ChatStoreService);
  private destroy$ = new Subject<void>();

  conversations: Conversation[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadConversations();
    this.subscribeToConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConversations(): void {
    this.loading = true;
    this.chatApi
      .getConversations(1, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.conversations = response.data;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading conversations:', error);
          this.loading = false;
        },
      });
  }

  private subscribeToConversations(): void {
    this.chatStore.conversations$
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversations: Conversation[]) => {
        this.conversations = conversations.slice(0, 10);
      });
  }

  getConversationName(conversation: Conversation): string {
    if (conversation.name) {
      return conversation.name;
    }

    if (conversation.participants && conversation.participants.length > 0) {
      return conversation.participants.map((p: any) => p.first_name).join(', ');
    }

    return 'Unnamed';
  }

  formatTime(dateString?: string): string {
    if (!dateString) return 'Just now';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}
