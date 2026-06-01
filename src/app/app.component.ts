import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaStatusComponent } from './components/pwa-status/pwa-status.component';
import { PwaService } from './services/pwa.service';
import { ChatInitService } from './chat/services/chat-init.service';
import { AuthService } from './services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaStatusComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ITHelp-desk-fe';
  private pwaService = inject(PwaService);
  private chatInitService = inject(ChatInitService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Initialize Socket.io when app loads
    this.initializeChatSocket();

    // Re-initialize Socket.io when user logs in
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          console.log('[AppComponent] User logged in, initializing chat socket');
          this.initializeChatSocket();
        } else {
          console.log('[AppComponent] User logged out, disconnecting chat socket');
          this.chatInitService.disconnect();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeChatSocket(): Promise<void> {
    try {
      // Check if user is authenticated
      const user = this.authService.getCurrentUser();
      if (user) {
        await this.chatInitService.initializeSocket();
      }
    } catch (error) {
      console.error('[AppComponent] Error initializing chat socket:', error);
    }
  }
}
