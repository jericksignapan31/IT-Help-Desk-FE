import { Injectable, Optional, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject, Observable, EMPTY } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  @Optional() private swUpdate = inject(SwUpdate, { optional: true });
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private installPromptSubject = new BehaviorSubject<any>(null);
  public installPrompt$ = this.installPromptSubject.asObservable();

  private isInstalledSubject = new BehaviorSubject<boolean>(this.getIsAppInstalled());
  public isInstalled$ = this.isInstalledSubject.asObservable();

  private isOnlineSubject = new BehaviorSubject<boolean>(this.getIsOnline());
  public isOnline$ = this.isOnlineSubject.asObservable();

  private updateAvailableSubject = new BehaviorSubject<boolean>(false);
  public updateAvailable$ = this.updateAvailableSubject.asObservable();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize PWA service safely
   */
  private initialize(): void {
    if (!this.isBrowser) {
      return;
    }

    // Use setTimeout to defer initialization to next tick
    setTimeout(() => {
      try {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOnlineOfflineListeners();
        this.setupServiceWorkerUpdates();
      } catch (error) {
        console.warn('PWA Service initialization warning:', error);
      }
    }, 0);
  }

  /**
   * Register the service worker
   */
  private registerServiceWorker(): void {
    if (!this.isBrowser || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✓ Service Worker registered');

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                this.updateAvailableSubject.next(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('Service Worker registration note:', error.message);
      });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('✓ Service Worker updated');
    });
  }

  private setupInstallPrompt(): void {
    if (!this.isBrowser) return;

    const beforeInstall = (e: any) => {
      e.preventDefault();
      this.installPromptSubject.next(e);
    };

    const onInstalled = () => {
      this.installPromptSubject.next(null);
      this.isInstalledSubject.next(true);
    };

    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', onInstalled);
  }

  private setupOnlineOfflineListeners(): void {
    if (!this.isBrowser) return;

    const onOnline = () => {
      this.isOnlineSubject.next(true);
    };

    const onOffline = () => {
      this.isOnlineSubject.next(false);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  }

  private setupServiceWorkerUpdates(): void {
    if (!this.isBrowser || !this.swUpdate || !this.swUpdate.isEnabled) {
      return;
    }

    try {
      this.swUpdate.checkForUpdate().catch(() => {
        // Ignore
      });

      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          this.updateAvailableSubject.next(true);
        }
      });
    } catch (error) {
      console.warn('Service Worker updates setup note:', (error as Error).message);
    }
  }

  public async installApp(): Promise<boolean> {
    if (!this.isBrowser) return false;

    const promptEvent = this.installPromptSubject.value;
    if (!promptEvent) {
      return false;
    }

    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        this.installPromptSubject.next(null);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Install error:', (error as Error).message);
      return false;
    }
  }

  public updateApp(): void {
    if (!this.isBrowser) return;

    if (this.swUpdate && this.swUpdate.isEnabled) {
      this.swUpdate.activateUpdate().then(() => {
        window.location.reload();
      }).catch(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }

  private getIsAppInstalled(): boolean {
    if (!this.isBrowser) return false;
    return this.isAppInstalled();
  }

  private getIsOnline(): boolean {
    if (!this.isBrowser) return true;
    return navigator.onLine;
  }

  private isAppInstalled(): boolean {
    try {
      return (
        (window.navigator as any).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches
      );
    } catch {
      return false;
    }
  }

  public isStandalone(): boolean {
    return this.getIsAppInstalled();
  }
}
