import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GroupChatService, Conversation, ChatMessage } from '../../services/group-chat.service';
import { AuthService } from '../../services/auth.service';
import { MessageInputComponent } from '../../chat/components/message-input/message-input.component';
import { FileAttachment } from '../../chat/models';
import { FileUploadService } from '../../chat/services/file-upload.service';
import { ChatApiService } from '../../chat/services/chat-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MessageInputComponent
  ],
  templateUrl: './group-chat.component.html',
  styleUrls: ['./group-chat.component.scss']
})
export class GroupChatComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  loading = true;
  sendingMessage = false;
  currentUserId: string | number | null = null;
  currentUser: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: GroupChatService,
    private authService: AuthService,
    private fileUploadService: FileUploadService,
    private chatApiService: ChatApiService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.currentUser = this.authService.currentUserValue;
    this.currentUserId = this.currentUser?.employee_id || this.currentUser?.id || null;
    
    this.loadAllConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllConversations(): void {
    this.loading = true;
    this.chatService.getAllConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (convs: any[]) => {
          // Transform conversations and sort by most recent
          this.conversations = (convs || [])
            .map(conv => this.transformConversation(conv))
            .sort((a, b) => {
              return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            });
          
          this.loading = false;
          
          // Auto-select first conversation
          if (this.conversations.length > 0) {
            this.selectConversation(this.conversations[0]);
          }
        },
        error: (err) => {
          console.error('Error loading conversations:', err);
          this.loading = false;
        }
      });
  }

  private transformConversation(conv: any): Conversation {
    return {
      conversation_id: conv.conversation_id,
      type: conv.type,
      name: conv.name,
      participant_ids: conv.participant_ids || [],
      messages: (conv.messages || []).map((msg: any) => ({
        ...msg,
        sender: {
          employee_id: msg.sender?.employee_id || msg.sender?.user_id || 'Unknown',
          first_name: msg.sender?.employee?.first_name || msg.sender?.first_name || msg.sender?.username || 'User',
          last_name: msg.sender?.employee?.last_name || msg.sender?.last_name || '',
          email: msg.sender?.employee?.email || msg.sender?.email || msg.sender?.username || ''
        }
      })),
      created_at: conv.created_at,
      updated_at: conv.updated_at
    };
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.messages = (conversation.messages || []).filter(msg => msg && msg.sender);
    this.newMessage = '';
    
    // Auto-scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);
  }

  onMessageSent(data: { text: string; attachments?: FileAttachment[] }): void {
    if (!data.text.trim() || !this.selectedConversation) {
      return;
    }

    this.sendingMessage = true;
    this.chatService.sendMessage(this.selectedConversation.conversation_id, data.text)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message: any) => {
          // Transform the message with current user info as sender
          const transformedMsg = {
            ...message,
            attachments: data.attachments || [],
            sender: {
              employee_id: this.currentUserId,
              first_name: this.currentUser?.first_name || this.currentUser?.username || 'You',
              last_name: this.currentUser?.last_name || '',
              email: this.currentUser?.email || this.currentUser?.username || ''
            }
          };

          this.messages.push(transformedMsg);
          this.chatService.addMessage(transformedMsg);
          this.sendingMessage = false;
          
          // Scroll to bottom
          setTimeout(() => this.scrollToBottom(), 0);
        },
        error: (err) => {
          console.error('Error sending message:', err);
          this.sendingMessage = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Failed to send message. Please try again.'
          });
        }
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) {
      return;
    }

    this.onMessageSent({ text: this.newMessage });
    this.newMessage = '';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  private scrollToBottom(): void {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  getConversationTitle(conv: Conversation): string {
    return conv.name || 'Chat';
  }

  getLastMessagePreview(conv: Conversation): string {
    if (conv.messages && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1];
      return lastMsg.content.substring(0, 50) + (lastMsg.content.length > 50 ? '...' : '');
    }
    return 'No messages';
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message?.sender?.employee_id === this.currentUserId;
  }

  downloadAttachment(attachment: FileAttachment): void {
    if (!attachment.file_url) {
      alert('File URL not available');
      return;
    }

    this.chatApiService.downloadFile(attachment.file_url).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading file:', err);
        alert('Failed to download file');
      }
    });
  }

  deleteAttachmentFile(attachment: FileAttachment): void {
    if (!attachment.id) {
      alert('Cannot delete file: missing attachment ID');
      return;
    }

    const confirmDelete = confirm(`Delete ${attachment.filename}?`);
    if (!confirmDelete) return;

    this.chatApiService.deleteAttachment(attachment.id).subscribe({
      next: () => {
        // Remove from local messages array
        this.messages = this.messages.map(msg => ({
          ...msg,
          attachments: msg.attachments?.filter((att: FileAttachment) => att.id !== attachment.id) || []
        }));
      },
      error: (err) => {
        console.error('Error deleting attachment:', err);
        alert('Failed to delete file');
      }
    });
  }

  getFileIcon(fileType: string): string {
    return this.fileUploadService.getFileIcon(fileType);
  }

  getFileDisplayName(filename: string): string {
    return this.fileUploadService.getFileDisplayName(filename);
  }
}
