import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface VoiceInputState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  isFinal: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VoiceInputService {
  private recognition: any;
  private stateSubject = new BehaviorSubject<VoiceInputState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    isFinal: false,
  });

  public state$ = this.stateSubject.asObservable();

  constructor() {
    this.initializeVoiceRecognition();
  }

  /**
   * Initialize Web Speech API
   */
  private initializeVoiceRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported');
      this.stateSubject.next({
        ...this.stateSubject.value,
        isSupported: false,
      });
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.stateSubject.next({
        ...this.stateSubject.value,
        isListening: true,
        isSupported: true,
        transcript: '',
      });
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const isFinal = finalTranscript.length > 0;
      const text = isFinal ? finalTranscript.trim() : interimTranscript;

      this.stateSubject.next({
        ...this.stateSubject.value,
        transcript: text,
        isFinal,
      });
    };

    this.recognition.onend = () => {
      this.stateSubject.next({
        ...this.stateSubject.value,
        isListening: false,
      });
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.stateSubject.next({
        ...this.stateSubject.value,
        isListening: false,
      });
    };

    this.stateSubject.next({
      ...this.stateSubject.value,
      isSupported: true,
    });
  }

  /**
   * Start listening for voice input
   */
  startListening(): void {
    if (this.recognition && !this.stateSubject.value.isListening) {
      this.recognition.start();
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition && this.stateSubject.value.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Abort listening
   */
  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.stateSubject.next({
        ...this.stateSubject.value,
        isListening: false,
        transcript: '',
      });
    }
  }

  /**
   * Get current state
   */
  getState(): VoiceInputState {
    return this.stateSubject.value;
  }

  /**
   * Clear transcript
   */
  clearTranscript(): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      transcript: '',
      isFinal: false,
    });
  }
}
