import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VoiceInputService, VoiceInputState } from '../../../services/voice-input.service';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss'],
})
export class MessageInputComponent implements OnInit, OnDestroy {
  @Input() disabled: boolean = false;
  @Input() placeholder: string = 'Ask me anything about IT...';
  @Input() maxLength: number = 500;
  @Output() sendMessage = new EventEmitter<string>();

  userMessage = '';
  voiceSupported = false;
  isListening = false;

  private destroy$ = new Subject<void>();

  constructor(private voiceInputService: VoiceInputService) {}

  ngOnInit(): void {
    this.voiceInputService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: VoiceInputState) => {
        this.voiceSupported = state.isSupported;
        this.isListening = state.isListening;

        // Auto-populate message with voice transcript
        if (state.isFinal && state.transcript) {
          this.userMessage = state.transcript;
          // Auto-send after voice input ends
          setTimeout(() => {
            this.onSend();
          }, 500);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.voiceInputService.abort();
  }

  /**
   * Handle send button click
   */
  onSend(): void {
    if (this.userMessage.trim() && !this.disabled) {
      this.sendMessage.emit(this.userMessage.trim());
      this.userMessage = '';
      this.voiceInputService.clearTranscript();
    }
  }

  /**
   * Handle Enter key
   */
  onKeyEnter(): void {
    this.onSend();
  }

  /**
   * Toggle voice input
   */
  toggleVoiceInput(): void {
    if (this.isListening) {
      this.voiceInputService.stopListening();
    } else {
      this.voiceInputService.startListening();
    }
  }

  /**
   * Clear message
   */
  clear(): void {
    this.userMessage = '';
  }
}
