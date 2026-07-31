import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'MOVEKART_THEME';
  private readonly themeSubject = new BehaviorSubject<AppTheme>(
    this.getInitialTheme(),
  );

  readonly theme$ = this.themeSubject.asObservable();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.applyTheme(this.themeSubject.value);
  }

  get currentTheme(): AppTheme {
    return this.themeSubject.value;
  }

  toggleTheme(): void {
    this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: AppTheme): void {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {}
    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  private getInitialTheme(): AppTheme {
    let savedTheme: string | null = null;

    try {
      savedTheme = localStorage.getItem(this.storageKey);
    } catch {}
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    return (window.matchMedia?.('(prefers-color-scheme: dark)').matches ??
      false)
      ? 'dark'
      : 'light';
  }
  private applyTheme(theme: AppTheme): void {
    const root = this.document.documentElement;

    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    this.document.body.setAttribute('data-theme', theme);
  }
}
