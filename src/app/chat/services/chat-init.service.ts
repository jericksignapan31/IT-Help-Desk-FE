import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ChatSocketService } from './chat-socket.service';

/**
 * Service responsible for initializing Socket.io connection
 * Called once when the app loads and user is authenticated
 */
@Injectable({
  providedIn: 'root',
})
export class ChatInitService {
  private authService = inject(AuthService);
  private chatSocketService = inject(ChatSocketService);
  private initialized = false;

  /**
   * Initialize Socket.io connection if user is authenticated
   */
  initializeSocket(): Promise<void> {
    return new Promise((resolve) => {
      // Check if already initialized
      if (this.initialized) {
        resolve();
        return;
      }

      // Get current user using the correct method
      const user = this.authService.getCurrentUser();
      
      if (!user) {
        console.log('[ChatInit] No authenticated user, skipping Socket.io initialization');
        resolve();
        return;
      }

      // Get token from localStorage (stored by auth service)
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('[ChatInit] No auth token found, skipping Socket.io initialization');
        resolve();
        return;
      }

      const userId = String(user.id || user.employee_id);
      
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.log('[ChatInit] No valid user ID found, skipping Socket.io initialization');
        resolve();
        return;
      }

      console.log('[ChatInit] Initializing Socket.io connection for user:', userId);

      // Connect to Socket.io
      this.chatSocketService
        .connect(userId, token)
        .then(() => {
          console.log('[ChatInit] ✅ Socket.io connected successfully');
          this.initialized = true;
          resolve();
        })
        .catch((error) => {
          console.error('[ChatInit] ❌ Failed to connect Socket.io:', error);
          // Don't fail app initialization, just log the error
          resolve();
        });
    });
  }

  /**
   * Check if Socket.io is connected
   */
  isConnected(): boolean {
    return this.chatSocketService.isConnected();
  }

  /**
   * Reconnect Socket.io (for when user logs back in)
   */
  reconnect(): Promise<void> {
    console.log('[ChatInit] Attempting to reconnect Socket.io');
    this.initialized = false;
    return this.initializeSocket();
  }

  /**
   * Disconnect Socket.io (for when user logs out)
   */
  disconnect(): void {
    console.log('[ChatInit] Disconnecting Socket.io');
    this.chatSocketService.disconnect();
    this.initialized = false;
  }
}
