import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ChatService } from '../../services/chat.service';
import { ChatbotService } from '../../services/chatbot.service';
import { MessageSendingService } from '../../services/message-sending.service';
import { FeedbackService } from '../../services/feedback.service';
import { TicketService } from '../../services/ticket.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { Conversation, Message } from '../../models/chat.model';
import { MessageListComponent } from '../components/message-list/message-list.component';
import { MessageInputComponent } from '../components/message-input/message-input.component';
import { QuickSuggestionsComponent } from '../components/quick-suggestions/quick-suggestions.component';
import { FeedbackModalComponent, FeedbackModalResult } from '../components/feedback-modal/feedback-modal.component';
import { TicketCreationDialogComponent } from '../components/ticket-creation-dialog/ticket-creation-dialog.component';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-chatbot-window',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MessageListComponent,
    MessageInputComponent,
    QuickSuggestionsComponent,
  ],
  templateUrl: './chatbot-window.component.html',
  styleUrls: ['./chatbot-window.component.scss'],
})
export class ChatbotWindowComponent implements OnInit, OnDestroy {
  @ViewChild(MessageListComponent) messageList!: MessageListComponent;

  conversation: Conversation | null = null;
  messages: Message[] = [];
  loading = false;
  error: string | null = null;
  darkMode = false;

  private destroy$ = new Subject<void>();

  constructor(
    public chatService: ChatService,
    private chatbotService: ChatbotService,
    private messageSendingService: MessageSendingService,
    private feedbackService: FeedbackService,
    private ticketService: TicketService,
    private themeService: ThemeService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.initializeChat();
    this.subscribeToMessages();
    this.subscribeToTheme();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize or load conversation
   */
  private initializeChat(): void {
    console.log('🔄 Initializing chatbot conversation...');
    this.chatService.startConversation().subscribe({
      next: (conv) => {
        console.log('✅ Conversation started:', conv.id);
        this.conversation = conv;
        this.loadConversationHistory(conv.id);
      },
      error: (err) => {
        console.error('❌ Failed to start conversation:', err);
        const errorMessage = err?.error?.message || 'Failed to start chat. Please check your connection and try again.';
        this.error = errorMessage;
        this.chatService.setError(errorMessage);
      },
    });
  }

  /**
   * Load conversation history from API
   */
  private loadConversationHistory(conversationId: string): void {
    this.chatService.getConversationHistory(conversationId).subscribe({
      next: (data) => {
        console.log('✅ Conversation history loaded:', data.messages?.length || 0, 'messages');
        this.chatService.setMessages(data.messages);
        this.messageList?.requestScroll();
      },
      error: (err) => {
        console.error('Failed to load conversation history:', err);
        // Start with empty messages if history loading fails
        this.messages = [];
      },
    });
  }

  /**
   * Subscribe to messages from service
   */
  private subscribeToMessages(): void {
    this.chatService.messages$.subscribe((messages) => {
      this.messages = messages;
      this.messageList?.requestScroll();
    });

    this.chatService.loading$.subscribe((loading) => {
      this.loading = loading;
    });

    this.chatService.error$.subscribe((error) => {
      this.error = error;
    });
  }

  /**
   * Send message to chatbot
   */
  /**
   * Send message using the MessageSendingService
   */
  sendMessage(messageText: string): void {
    if (!messageText.trim() || !this.conversation) {
      return;
    }

    this.messageSendingService
      .sendMessageAndGetResponse(this.conversation.id, messageText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            // Scroll to latest message
            this.messageList?.requestScroll();
          } else {
            console.error('Failed to send message:', result.error);
          }
        },
        error: (err) => {
          console.error('Error sending message:', err);
        },
      });
  }

  /**
   * Handle action button clicks
   */
  handleAction(actionType: string): void {
    console.log('Action:', actionType);
    
    switch (actionType.toUpperCase()) {
      case 'CREATE_TICKET':
        this.openTicketCreationDialog();
        break;
      case 'CLOSE':
        // Close chat window
        break;
      default:
        console.warn('Unknown action:', actionType);
    }
  }

  /**
   * Open ticket creation dialog
   */
  private openTicketCreationDialog(): void {
    const conversationSummary = this.getConversationSummary();

    const dialogRef = this.dialog.open(TicketCreationDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        conversationId: this.conversation?.id,
        title: conversationSummary.title,
        description: conversationSummary.description,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.createTicketFromDialog(result);
      }
    });
  }

  /**
   * Get conversation summary for ticket pre-fill
   */
  private getConversationSummary(): { title: string; description: string } {
    if (!this.messages || this.messages.length === 0) {
      return { title: '', description: '' };
    }

    // Get the first user message as title (subject)
    const firstUserMessage = this.messages.find((m) => m.type === 'user');
    const title = firstUserMessage ? firstUserMessage.content.substring(0, 100) : '';

    // Combine last few messages as description
    const recentMessages = this.messages.slice(-5);
    const description = recentMessages
      .map((m) => `${m.type.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    return { title, description };
  }

  /**
   * Create ticket from dialog result
   */
  private createTicketFromDialog(formData: any): void {
    const ticketPayload = {
      subject: formData.subject,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      // conversation_id will be added by backend if needed
    };

    this.ticketService.createTicket(ticketPayload).subscribe({
      next: (ticket) => {
        Swal.fire({
          icon: 'success',
          title: 'Ticket Created!',
          html: `Your support ticket has been created successfully.<br><strong>Ticket ID: ${ticket.ticket_id}</strong><br>Our team will review it shortly.`,
          timer: 4000,
          showConfirmButton: true,
        });

        // Add system message to chat
        const systemMessage: Message = {
          id: uuidv4(),
          conversationId: this.conversation?.id || '',
          type: 'system',
          content: `✅ Ticket #${ticket.ticket_id} created successfully. Our support team will contact you soon.`,
          timestamp: new Date(),
          confidence: 1,
        };

        this.messages.push(systemMessage);
      },
      error: (err) => {
        console.error('Failed to create ticket:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create ticket. Please try again or contact support.',
        });
      },
    });
  }

  /**
   * Handle feedback button click from message
   */
  handleFeedbackClick(message: Message): void {
    const interactionId = message.interactionId || uuidv4();
    const subject = `Response: "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`;

    const dialogRef = this.dialog.open(FeedbackModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        interactionId,
        subject,
      },
    });

    dialogRef.afterClosed().subscribe((result: FeedbackModalResult | undefined) => {
      if (result) {
        this.feedbackService
          .submitFeedback({
            interaction_id: interactionId,
            satisfaction_score: result.rating,
            is_helpful: result.isHelpful,
            user_feedback: result.comment || `Rating: ${result.rating}/5 stars`,
          })
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Thank You!',
                text: 'Your feedback has been recorded.',
                timer: 2000,
                showConfirmButton: false,
              });
            },
            error: (err) => {
              console.error('Failed to submit feedback:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to submit feedback. Please try again.',
              });
            },
          });
      }
    });
  }

  /**
   * Clear chat
   */
  clearChat(): void {
    Swal.fire({
      title: 'Clear Chat?',
      text: 'This will start a new conversation.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, clear',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.chatService.clearMessages();
        this.initializeChat();
      }
    });
  }
  /**
   * Subscribe to theme changes
   */
  private subscribeToTheme(): void {
    this.themeService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((isDark) => {
      this.darkMode = isDark;
    });
    // Set initial value
    this.darkMode = this.themeService.isDarkMode();
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }}

