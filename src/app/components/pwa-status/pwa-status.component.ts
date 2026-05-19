import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { PwaService } from '../../services/pwa.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-pwa-status',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './pwa-status.component.html',
  styleUrls: ['./pwa-status.component.scss'],
})
export class PwaStatusComponent implements OnInit, OnDestroy {
  private pwaService = inject(PwaService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  isOnline$!: Observable<boolean>;
  isInstalled$!: Observable<boolean>;
  updateAvailable$!: Observable<boolean>;
  installPrompt$!: Observable<any>;

  // Check if running in development mode (localhost)
  isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  ngOnInit(): void {
    try {
      // Initialize observables in ngOnInit
      this.isOnline$ = this.pwaService.isOnline$;
      this.isInstalled$ = this.pwaService.isInstalled$;
      this.updateAvailable$ = this.pwaService.updateAvailable$;
      this.installPrompt$ = this.pwaService.installPrompt$;

      this.setupUpdateNotification();
    } catch (error) {
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupUpdateNotification(): void {
    try {
      this.updateAvailable$
        .pipe(takeUntil(this.destroy$))
        .subscribe((available) => {
          if (available) {
          }
        });
    } catch (error) {
    }
  }

  async installApp(): Promise<void> {
    try {
      const success = await this.pwaService.installApp();
      if (success) {
      }
    } catch (error) {
    }
  }

  showInstallInstructions(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (userAgent.includes('windows') || userAgent.includes('linux')) {
      if (userAgent.includes('chrome') || userAgent.includes('edge')) {
        instructions = `
          📱 Install IT Help Desk App:
          
          1. Click the menu icon (⋮) in the top-right
          2. Select "Install app" or "Create shortcut"
          3. Choose where to save it
          4. Done! The app will open in a standalone window
          
          Or install on home screen:
          1. Press Ctrl+Shift+I to open DevTools
          2. Go to Application → Manifest
          3. Click "Install" button
        `;
      } else {
        instructions = `
          📱 Install IT Help Desk App:
          
          On HTTPS (production): The install button will appear automatically
          On localhost: You can install via your browser's app menu
          
          For Chrome/Edge:
          1. Click menu (⋮) → Install app
          2. Follow the prompts
        `;
      }
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      instructions = `
        📱 Install IT Help Desk App on iOS:
        
        1. Tap the Share button (square with arrow)
        2. Scroll down and tap "Add to Home Screen"
        3. Give it a name and tap "Add"
        4. Done! The app is now on your home screen
      `;
    } else if (userAgent.includes('android')) {
      instructions = `
        📱 Install IT Help Desk App on Android:
        
        1. Tap the menu button (⋮) 
        2. Tap "Install app"
        3. Confirm the installation
        4. Done! The app is now installed
      `;
    } else {
      instructions = `
        📱 Install IT Help Desk App:
        
        Your browser should show an install prompt.
        Look for an "Install" button in the address bar or app menu.
      `;
    }

    alert(instructions);
  }

  updateApp(): void {
    this.pwaService.updateApp();
  }
}
