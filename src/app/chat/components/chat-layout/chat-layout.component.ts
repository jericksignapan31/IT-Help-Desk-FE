import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ChatApiService } from '../../services/chat-api.service';
import { ChatSocketService } from '../../services/chat-socket.service';
import { ChatStoreService } from '../../store/chat-store.service';
import { AuthService } from '../../../services/auth.service';
import { UserAccountService } from '../../../services/user-account.service';
import { EmployeeService } from '../../../services/employee.service';
import { Conversation, Message, CreateConversationRequest, CreateMessageRequest } from '../../models';
import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { ConversationDetailComponent } from '../conversation-detail/conversation-detail.component';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatProgressSpinnerModule, ConversationListComponent, ConversationDetailComponent],
  template: `
    <div class="chat-container">
      <div class="chat-list-panel">
        <app-conversation-list
          [conversations]="(conversations$ | async) || []"
          [currentConversation]="currentConversation$ | async"
          [loading]="(loading$ | async) || false"
          (selectConversation)="onSelectConversation($event)"
          (deleteConversation)="onDeleteConversation($event)"
          (createNew)="onCreateNew()"
        ></app-conversation-list>
      </div>

      <div class="chat-detail-panel">
        <app-conversation-detail
          [conversation]="currentConversation$ | async"
          [messages]="(currentMessages$ | async) || []"
          [typingUsers]="(typingUsers$ | async) || []"
          [currentUserId]="currentUserId"
          [loadingMessages]="(loadingMessages$ | async) || false"
          [disabled]="(disabled$ | async) || false"
          (sendMessage)="onSendMessage($event)"
          (deleteMessage)="onDeleteMessage($event)"
          (typing)="onTyping()"
          (stoppedTyping)="onStoppedTyping()"
          (deleteConversation)="onConfirmDeleteConversation($event)"
          (info)="onConversationInfo($event)"
        ></app-conversation-detail>
      </div>
    </div>
  `,
  styles: [
    `
      .chat-container {
        display: flex;
        height: 100%;
        gap: 0;
        background-color: #fff;
      }

      .chat-list-panel {
        width: 300px;
        height: 100%;
        border-right: 1px solid #e0e0e0;
        display: flex;
        flex-direction: column;
      }

      .chat-detail-panel {
        flex: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      @media (max-width: 768px) {
        .chat-list-panel {
          width: 250px;
        }
      }

      @media (max-width: 600px) {
        .chat-list-panel {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid #e0e0e0;
        }

        .chat-container {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  private chatApi = inject(ChatApiService);
  private chatSocket = inject(ChatSocketService);
  private chatStore = inject(ChatStoreService);
  private authService = inject(AuthService);
  private userAccountService = inject(UserAccountService);
  private employeeService = inject(EmployeeService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  conversations$ = this.chatStore.conversations$;
  currentConversation$ = this.chatStore.currentConversation$;
  currentMessages$ = this.chatStore.currentMessages$;
  loading$ = this.chatStore.loading$;
  loadingMessages$ = new Subject<boolean>();
  disabled$ = new Subject<boolean>();
  typingUsers$ = new Subject<string[]>();

  currentUserId: string = '';
  private typingTimeout: any;

  ngOnInit(): void {
    this.initChat();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatSocket.disconnect();
  }

  private initChat(): void {
    // Get current user
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      Swal.fire('Error', 'User not authenticated', 'error');
      return;
    }

    this.currentUserId = String(currentUser.id);

    // Initialize socket connection
    const token = localStorage.getItem('token') || '';
    this.chatSocket
      .connect(this.currentUserId, token)
      .then(() => {
        this.loadConversations();
        this.setupSocketListeners();
        this.subscribeToSocketEvents();
      })
      .catch((error) => {
        console.error('Failed to connect socket:', error);
        Swal.fire('Connection Error', 'Failed to connect to chat', 'error');
      });
  }

  private loadConversations(): void {
    this.chatStore.setLoading(true);
    this.chatApi
      .getConversations(1, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.chatStore.setConversations(response.data);
          this.chatStore.setLoading(false);
        },
        error: (error) => {
          console.error('Error loading conversations:', error);
          this.chatStore.setLoading(false);
          this.chatStore.setError('Failed to load conversations');
        },
      });
  }

  private loadMessages(conversationId: string): void {
    (this.loadingMessages$ as Subject<boolean>).next(true);
    this.chatApi
      .getMessages(conversationId, 1, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.chatStore.setMessages(conversationId, response.data);
          (this.loadingMessages$ as Subject<boolean>).next(false);
          this.chatSocket.joinConversation(conversationId);
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          (this.loadingMessages$ as Subject<boolean>).next(false);
        },
      });
  }

  private setupSocketListeners(): void {
    // Listen for connection status
    this.chatSocket.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected) => {
        (this.disabled$ as Subject<boolean>).next(!connected);
      });

    // Listen for errors
    this.chatSocket.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) {
          this.chatStore.setError(error);
        }
      });
  }

  private subscribeToSocketEvents(): void {
    // New message received
    this.chatSocket.messageReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        if (message) {
          const currentConv = this.chatStore.getCurrentConversation();
          if (currentConv && message.conversation_id === currentConv.id) {
            this.chatStore.addMessage(message.conversation_id, message);
          }
        }
      });

    // User typing
    this.chatSocket.userTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data) {
          const currentConv = this.chatStore.getCurrentConversation();
          if (currentConv && data.conversationId === currentConv.id) {
            this.chatStore.addTypingUser(data.conversationId, data.userId);
          }
        }
      });

    // User stopped typing
    this.chatSocket.userStoppedTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe((userId) => {
        if (userId) {
          const currentConv = this.chatStore.getCurrentConversation();
          if (currentConv) {
            this.chatStore.removeTypingUser(currentConv.id, userId);
          }
        }
      });

    // Message read
    this.chatSocket.messageRead$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data) {
          this.chatStore.updateMessage(data.conversationId, data.messageId, { is_read: true });
        }
      });

    // Subscribe to typing users in current conversation
    this.chatStore.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        if (state.currentConversation) {
          const typingUsers = state.typingUsers.get(state.currentConversation.id) || [];
          (this.typingUsers$ as Subject<string[]>).next(typingUsers);
        }
      });
  }

  onSelectConversation(conversation: Conversation): void {
    this.chatStore.setCurrentConversation(conversation);
    this.loadMessages(conversation.id);
  }

  onSendMessage(text: string): void {
    const currentConv = this.chatStore.getCurrentConversation();
    if (!currentConv) return;

    const request: CreateMessageRequest = {
      conversation_id: currentConv.id,
      text,
    };

    this.chatApi
      .sendMessage(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.chatStore.addMessage(currentConv.id, message);
          this.chatSocket.emitStopTyping(currentConv.id);
        },
        error: (error) => {
          console.error('Error sending message:', error);
          Swal.fire('Error', 'Failed to send message', 'error');
        },
      });
  }

  onDeleteMessage(message: Message): void {
    const currentConv = this.chatStore.getCurrentConversation();
    if (!currentConv) return;

    this.chatApi
      .deleteMessage(message.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.chatStore.deleteMessage(currentConv.id, message.id);
          Swal.fire('Success', 'Message deleted', 'success');
        },
        error: (error) => {
          console.error('Error deleting message:', error);
          Swal.fire('Error', 'Failed to delete message', 'error');
        },
      });
  }

  onDeleteConversation(conversation: Conversation): void {
    this.chatApi
      .deleteConversation(conversation.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.chatStore.deleteConversation(conversation.id);
          Swal.fire('Success', 'Conversation deleted', 'success');
          this.loadConversations();
        },
        error: (error) => {
          console.error('Error deleting conversation:', error);
          Swal.fire('Error', 'Failed to delete conversation', 'error');
        },
      });
  }

  onConfirmDeleteConversation(conversation: Conversation): void {
    if (confirm('Are you sure you want to delete this conversation?')) {
      this.onDeleteConversation(conversation);
    }
  }

  onTyping(): void {
    const currentConv = this.chatStore.getCurrentConversation();
    if (!currentConv) return;

    this.chatSocket.emitTyping(currentConv.id);

    // Reset typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.chatSocket.emitStopTyping(currentConv.id);
    }, 3000);
  }

  onStoppedTyping(): void {
    const currentConv = this.chatStore.getCurrentConversation();
    if (!currentConv) return;

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.chatSocket.emitStopTyping(currentConv.id);
  }

  onCreateNew(): void {
    // Fetch both users and employees in parallel
    forkJoin([
      this.userAccountService.getUserAccounts(),
      this.employeeService.getEmployees(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([users, employees]) => {
          console.log('Users from API:', users);
          console.log('First user keys:', users.length > 0 ? Object.keys(users[0]) : 'No users');
          
          // Filter out current user - try multiple ID field names
          const otherUsers = users.filter((user: any) => {
            const userId = user.id || user.user_id || user.userId;
            return String(userId) !== this.currentUserId;
          });

          if (otherUsers.length === 0) {
            Swal.fire('Info', 'No other users available', 'info');
            return;
          }

          // Create a map of employees by ID for quick lookup
          const employeeMap = new Map(employees.map((emp) => [String(emp.employee_id), emp]));

          // Create dropdown options with full names
          const userOptions = otherUsers
            .map((user: any, index: number) => {
              // Try to get the user ID from multiple possible field names
              // Fallback to username if ID fields not found
              const userId = user.id ?? user.user_id ?? user.userId ?? user.username ?? String(index);
              let displayName = user.username;
              
              console.log(`User[${index}]:`, { 
                userId, 
                username: user.username, 
                id: user.id, 
                user_id: user.user_id,
                allKeys: Object.keys(user)
              });
              
              // Try to get employee data
              const employee = employeeMap.get(String(user.employee_id));
              if (employee) {
                const firstName = employee.first_name || '';
                const lastName = employee.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                if (fullName) {
                  displayName = fullName;
                }
              }
              
              return `<option value="${userId}">${displayName}</option>`;
            })
            .join('');

          Swal.fire({
            title: 'Start New Conversation',
            html: `
              <label style="display: block; text-align: left; margin-bottom: 8px; font-weight: 500;">
                Select User:
              </label>
              <select id="user" class="swal2-input">
                <option value="">-- Choose a user --</option>
                ${userOptions}
              </select>
              <label style="display: block; text-align: left; margin-bottom: 8px; font-weight: 500; margin-top: 16px;">
                Conversation Type:
              </label>
              <select id="type" class="swal2-input">
                <option value="DIRECT">Direct Message</option>
                <option value="GROUP">Group Chat</option>
              </select>
            `,
            confirmButtonText: 'Create',
            showCancelButton: true,
            preConfirm: () => {
              const userId = (document.getElementById('user') as HTMLSelectElement).value;
              const type = (document.getElementById('type') as HTMLSelectElement).value;

              if (!userId) {
                Swal.showValidationMessage('Please select a user');
                return null;
              }

              return { userId, type };
            },
          }).then((result) => {
            if (result.isConfirmed) {
              const { userId, type } = result.value;
              this.createDirectConversation(userId, type);
            }
          });
        },
        error: (error) => {
          console.error('Error loading users:', error);
          Swal.fire('Error', 'Failed to load users', 'error');
        },
      });
  }

  private createDirectConversation(otherUserId: string, type: string): void {
    const request: CreateConversationRequest = {
      type: type as 'DIRECT' | 'GROUP',
      participant_ids: [this.currentUserId, otherUserId],
    };

    console.log('Creating conversation with request:', JSON.stringify(request, null, 2));
    console.log('Current User ID:', this.currentUserId, '|  Other User ID:', otherUserId);

    this.chatApi
      .createConversation(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversation) => {
          this.chatStore.addConversation(conversation);
          this.chatStore.setCurrentConversation(conversation);
          this.loadMessages(conversation.id);
          Swal.fire('Success', 'Conversation created', 'success');
        },
        error: (error) => {
          console.error('HTTP Error creating conversation:');
          console.error('Status:', error.status);
          console.error('StatusText:', error.statusText);
          console.error('Response:', error.error);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          
          const errorMsg = error.error?.message || error.error?.error || 'Failed to create conversation';
          Swal.fire('Error', errorMsg, 'error');
        },
      });
  }

  onConversationInfo(conversation: Conversation): void {
    const participantsList = conversation.participants?.map((p) => p.email).join('\n') || 'No participants';
    Swal.fire({
      title: 'Conversation Info',
      html: `
        <div style="text-align: left;">
          <p><strong>Type:</strong> ${conversation.type}</p>
          <p><strong>Created:</strong> ${new Date(conversation.created_at).toLocaleDateString()}</p>
          <p><strong>Participants:</strong></p>
          <pre>${participantsList}</pre>
        </div>
      `,
      confirmButtonText: 'Close',
    });
  }
}
