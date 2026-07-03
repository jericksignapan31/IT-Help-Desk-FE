import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, ViewChild, ElementRef, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FileAttachment } from '../../models';
import { FileUploadService } from '../../services/file-upload.service';
import { ChatApiService } from '../../services/chat-api.service';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    TextFieldModule,
  ],
  template: `
    <div class="message-input-wrapper">
      <!-- File preview section -->
      <div *ngIf="selectedFiles.length > 0" class="file-preview-section">
        <div class="file-preview-list">
          <div
            *ngFor="let attachment of selectedFiles; let i = index"
            class="file-preview-item"
          >
            <div class="file-preview-content">
              <!-- Image preview -->
              <img
                *ngIf="attachment.preview_url"
                [src]="attachment.preview_url"
                [alt]="attachment.filename"
                class="image-preview"
              />
              <!-- File icon for non-images -->
              <div
                *ngIf="!attachment.preview_url"
                class="file-icon-placeholder"
              >
                <mat-icon [matTooltip]="attachment.filename">
                  {{ fileUploadService.getFileIcon(attachment.file_type) }}
                </mat-icon>
              </div>
            </div>
            <!-- File info -->
            <div class="file-info">
              <span class="file-name" [matTooltip]="attachment.filename">
                {{ fileUploadService.getFileDisplayName(attachment.filename) }}
              </span>
              <span class="file-size">
                {{ fileUploadService.formatFileSize(attachment.file_size) }}
              </span>
            </div>
            <!-- Remove button -->
            <button
              type="button"
              mat-icon-button
              (click)="removeFile(i)"
              class="remove-btn"
              matTooltip="Remove file"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Main input section -->
      <div
        class="message-input-container"
        [class.drag-over]="isDragOver"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <!-- Hidden file input -->
        <input
          #fileInput
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          (change)="onFileSelected($event)"
          class="hidden-file-input"
        />

        <!-- File upload button -->
        <button
          type="button"
          mat-icon-button
          (click)="fileInput.click()"
          class="file-upload-btn"
          [matTooltip]="'Attach files (drag & drop also works)'"
          [disabled]="disabled"
        >
          <mat-icon>attach_file</mat-icon>
        </button>

        <!-- Message input field -->
        <mat-form-field appearance="outline" class="message-field">
          <mat-label>Type a message...</mat-label>
          <textarea
            matInput
            [(ngModel)]="messageText"
            (input)="onMessageInput()"
            (keydown.enter)="onKeydownEnter($event)"
            cdkTextareaAutosize
            cdkAutosizeMinRows="1"
            cdkAutosizeMaxRows="4"
            placeholder="Press Enter to send, Shift+Enter for new line"
          ></textarea>
        </mat-form-field>

        <!-- Send button -->
        <button
          mat-icon-button
          (click)="onSendMessage()"
          [disabled]="(!messageText.trim() && selectedFiles.length === 0) || disabled"
          class="send-btn"
          [class.sending]="sending"
        >
          <mat-icon>{{ sending ? 'schedule' : 'send' }}</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        flex-shrink: 0;
      }

      .message-input-wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
        flex-shrink: 0;
      }

      .file-preview-section {
        padding: 12px 16px 0 16px;
        background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
      }

      .file-preview-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 12px;
      }

      .file-preview-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        max-width: 120px;
      }

      .file-preview-content {
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 4px;
        overflow: hidden;
      }

      .image-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .file-icon-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #667eea;
      }

      .file-icon-placeholder mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .file-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        font-size: 12px;
      }

      .file-name {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
        text-align: center;
      }

      .file-size {
        color: #999;
        font-size: 11px;
      }

      .remove-btn {
        position: absolute;
        top: 0;
        right: 0;
        width: 24px;
        height: 24px;
        min-width: 24px;
      }

      .hidden-file-input {
        display: none;
      }

      .message-input-container {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
        border-top: 1px solid #e5e5e5;
        align-items: flex-end;
        box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        transition: all 0.2s ease;
        min-height: 50px;
      }

      .message-input-container.drag-over {
        background: linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%);
        border-top: 2px solid #667eea;
      }

      .file-upload-btn {
        color: #667eea;
      }

      .file-upload-btn:hover:not(:disabled) {
        background: rgba(102, 126, 234, 0.1);
      }

      .file-upload-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .message-field {
        flex: 1;
        min-width: 0;
      }

      .message-field ::ng-deep {
        .mdc-text-field {
          background-color: #fff !important;
          border-radius: 20px !important;
          border: 1px solid #e0e0e0 !important;
        }

        .mdc-text-field--focused {
          border-color: #667eea !important;
        }

        .mat-mdc-form-field-focus-overlay {
          background-color: transparent !important;
        }

        .mat-mdc-notched-outline__leading,
        .mat-mdc-notched-outline__trailing {
          border-radius: 20px !important;
        }

        textarea {
          padding: 10px 14px !important;
          border-radius: 20px;
          font-family: inherit;
          resize: none;
        }

        .mat-mdc-form-field-hint-wrapper {
          display: none;
        }
      }

      .send-btn {
        height: 40px;
        width: 40px;
        min-width: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
      }

      .send-btn:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #ccc !important;
        box-shadow: none;
      }

      .send-btn.sending {
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(0.95);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @media (max-width: 768px) {
        .message-input-container {
          padding: 10px 12px;
          gap: 6px;
        }

        .send-btn {
          height: 36px;
          width: 36px;
        }

        .file-preview-item {
          max-width: 100px;
        }

        .file-preview-content {
          width: 80px;
          height: 80px;
        }
      }
    `,
  ],
})
export class MessageInputComponent implements OnInit, OnDestroy {
  @Input() disabled: boolean = false;
  @Input() currentConversationId: string = '';
  @Output() messageSent = new EventEmitter<{ text: string; attachments?: FileAttachment[] }>();
  @Output() typing = new EventEmitter<void>();
  @Output() stoppedTyping = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  messageText: string = '';
  sending: boolean = false;
  selectedFiles: FileAttachment[] = [];
  isDragOver: boolean = false;
  private destroy$ = new Subject<void>();
  private typingTimeout: any;
  private isTyping: boolean = false;

  constructor(
    public fileUploadService: FileUploadService,
    private injector: Injector
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  onMessageInput(): void {
    if (!this.isTyping && this.messageText.trim()) {
      this.isTyping = true;
      this.typing.emit();
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      if (this.isTyping) {
        this.isTyping = false;
        this.stoppedTyping.emit();
      }
    }, 3000);
  }

  onKeydownEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    this.onSendMessage(keyboardEvent);
  }

  onSendMessage(event?: KeyboardEvent): void {
    if (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
      } else if (event.key === 'Enter' && event.shiftKey) {
        return;
      } else {
        return;
      }
    }

    const message = this.messageText.trim();
    if (!message && this.selectedFiles.length === 0) {
      return;
    }

    if (this.disabled) {
      return;
    }

    this.sending = true;
    this.isTyping = false;
    this.stoppedTyping.emit();

    // If files are selected, upload them first
    if (this.selectedFiles.length > 0) {
      this.uploadFilesAndSend(message);
    } else {
      // Send message without files
      this.messageSent.emit({
        text: message,
        attachments: undefined,
      });
      this.resetForm();
    }
  }

  private uploadFilesAndSend(messageText: string): void {
    if (!this.currentConversationId) {
      alert('Error: Conversation ID not set');
      this.sending = false;
      return;
    }

    // Convert FileAttachment objects to actual files
    const filesToUpload: File[] = [];
    let processedCount = 0;

    this.selectedFiles.forEach((att) => {
      if (att.preview_url) {
        // Has preview (likely an image)
        fetch(att.preview_url)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], att.filename, {
              type: att.file_type,
            });
            filesToUpload.push(file);
            processedCount++;

            // Once all files are converted, upload them
            if (processedCount === this.selectedFiles.length) {
              this.performUpload(filesToUpload, messageText);
            }
          })
          .catch((error) => {
            console.warn(`Failed to process file ${att.filename}:`, error);
            processedCount++;
            if (processedCount === this.selectedFiles.length && filesToUpload.length > 0) {
              this.performUpload(filesToUpload, messageText);
            }
          });
      } else {
        // No preview, create empty file
        const file = new File([''], att.filename, {
          type: att.file_type,
        });
        filesToUpload.push(file);
        processedCount++;

        if (processedCount === this.selectedFiles.length) {
          this.performUpload(filesToUpload, messageText);
        }
      }
    });
  }

  private performUpload(files: File[], messageText: string): void {
    const chatApi = this.injector.get(ChatApiService);

    chatApi.uploadFiles(this.currentConversationId, files).subscribe({
      next: (response) => {
        console.log('Files uploaded successfully:', response.attachments);

        // Send message with returned attachment URLs from backend
        this.messageSent.emit({
          text: messageText,
          attachments: response.attachments,
        });

        this.resetForm();
      },
      error: (error) => {
        console.error('File upload failed:', error);
        const errorMsg =
          error.error?.message || 'Failed to upload files';
        alert(`Upload Error: ${errorMsg}`);
        this.sending = false;
      },
    });
  }

  private resetForm(): void {
    setTimeout(() => {
      this.messageText = '';
      this.selectedFiles = [];
      this.sending = false;
    }, 300);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.processFiles(Array.from(input.files));
    input.value = ''; // Reset input
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (!event.dataTransfer?.files) return;

    this.processFiles(Array.from(event.dataTransfer.files));
  }

  private processFiles(files: File[]): void {
    files.forEach(async (file) => {
      const validation = this.fileUploadService.validateFile(file);
      if (!validation.valid) {
        alert(`Error: ${validation.error}`);
        return;
      }

      try {
        const attachment = await this.fileUploadService.createFileAttachmentWithPreview(file);
        this.selectedFiles.push(attachment);
      } catch (error) {
        console.error('Error processing file:', error);
        alert('Failed to process file');
      }
    });
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }
}
