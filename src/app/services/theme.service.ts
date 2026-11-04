import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'chatbot-theme';
  private readonly LIGHT_THEME = 'light';
  private readonly DARK_THEME = 'dark';

  private darkModeSubject = new BehaviorSubject<boolean>(this.loadTheme());
  public darkMode$: Observable<boolean> = this.darkModeSubject.asObservable();

  constructor() {
    this.applyTheme(this.darkModeSubject.value);
  }

  /**
   * Load theme preference from localStorage
   */
  private loadTheme(): boolean {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      return savedTheme === this.DARK_THEME;
    }
    // Default to light mode
    return false;
  }

  /**
   * Toggle dark mode and persist preference
   */
  toggleDarkMode(): void {
    const newDarkMode = !this.darkModeSubject.value;
    this.darkModeSubject.next(newDarkMode);
    this.applyTheme(newDarkMode);
    this.persistTheme(newDarkMode);
  }

  /**
   * Set dark mode explicitly
   */
  setDarkMode(isDark: boolean): void {
    this.darkModeSubject.next(isDark);
    this.applyTheme(isDark);
    this.persistTheme(isDark);
  }

  /**
   * Get current dark mode state
   */
  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }

  /**
   * Apply theme to document root
   */
  private applyTheme(isDark: boolean): void {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
  }

  /**
   * Persist theme preference to localStorage
   */
  private persistTheme(isDark: boolean): void {
    const theme = isDark ? this.DARK_THEME : this.LIGHT_THEME;
    localStorage.setItem(this.THEME_KEY, theme);
  }
}
