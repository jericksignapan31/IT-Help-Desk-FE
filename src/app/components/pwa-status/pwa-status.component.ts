import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaService } from '../../services/pwa.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-pwa-status',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './pwa-status.component.html',
  styleUrls: ['./pwa-status.component.scss'],
})
export class PwaStatusComponent implements OnInit, OnDestroy {
  private pwaService = inject(PwaService);
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
      console.warn('PwaStatusComponent init error:', (error as Error).message);
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
            console.log('✓ Update available - refresh to get the latest version');
          }
        });
    } catch (error) {
      console.warn('PWA Status setup note:', (error as Error).message);
    }
  }

  async installApp(): Promise<void> {
    try {
      const success = await this.pwaService.installApp();
      if (success) {
        console.log('✓ App installed successfully');
      }
    } catch (error) {
      console.warn('Install note:', (error as Error).message);
    }
  }

  updateApp(): void {
    this.pwaService.updateApp();
  }
}
