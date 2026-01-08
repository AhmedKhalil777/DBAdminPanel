import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class AppThemeService {
  private readonly STORAGE_KEY = 'dbadminpanel_app_theme';
  
  // Default to dark mode
  currentTheme = signal<AppTheme>('dark');

  constructor() {
    // Load theme from localStorage on service initialization
    this.loadTheme();
    
    // Apply theme whenever it changes
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    this.saveTheme(theme);
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  private loadTheme(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY) as AppTheme;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        this.currentTheme.set(savedTheme);
      } else {
        // Default to dark mode if no saved preference
        this.currentTheme.set('dark');
      }
    }
  }

  private saveTheme(theme: AppTheme): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }

  private applyTheme(theme: AppTheme): void {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      // Dark theme colors
      root.style.setProperty('--app-bg-primary', '#0a0e27');
      root.style.setProperty('--app-bg-secondary', '#1a1f3a');
      root.style.setProperty('--app-bg-tertiary', '#0f1419');
      root.style.setProperty('--app-bg-card', 'rgba(26, 31, 58, 0.8)');
      root.style.setProperty('--app-bg-card-hover', 'rgba(26, 31, 58, 0.95)');
      root.style.setProperty('--app-bg-input', 'rgba(26, 31, 58, 0.5)');
      root.style.setProperty('--app-bg-table', 'rgba(26, 31, 58, 0.6)');
      root.style.setProperty('--app-bg-toolbar', 'rgba(26, 31, 58, 0.9)');
      root.style.setProperty('--app-bg-sidenav', 'linear-gradient(180deg, rgba(26, 31, 58, 0.95) 0%, rgba(15, 20, 25, 0.95) 100%)');
      
      root.style.setProperty('--app-text-primary', '#e0e0e0');
      root.style.setProperty('--app-text-secondary', 'rgba(224, 224, 224, 0.9)');
      root.style.setProperty('--app-text-tertiary', 'rgba(224, 224, 224, 0.7)');
      
      root.style.setProperty('--app-accent', '#00d4ff');
      root.style.setProperty('--app-accent-hover', '#00e5ff');
      root.style.setProperty('--app-accent-secondary', '#0099cc');
      root.style.setProperty('--app-accent-alpha-1', 'rgba(0, 212, 255, 0.1)');
      root.style.setProperty('--app-accent-alpha-2', 'rgba(0, 212, 255, 0.2)');
      root.style.setProperty('--app-accent-alpha-3', 'rgba(0, 212, 255, 0.3)');
      root.style.setProperty('--app-accent-alpha-5', 'rgba(0, 212, 255, 0.5)');
      
      root.style.setProperty('--app-border', 'rgba(0, 212, 255, 0.2)');
      root.style.setProperty('--app-border-hover', 'rgba(0, 212, 255, 0.3)');
      
      root.style.setProperty('--app-shadow', 'rgba(0, 0, 0, 0.4)');
      root.style.setProperty('--app-shadow-light', 'rgba(0, 0, 0, 0.3)');
      
      root.style.setProperty('--app-scrollbar-track', 'rgba(26, 31, 58, 0.5)');
      root.style.setProperty('--app-scrollbar-thumb', 'linear-gradient(180deg, #00d4ff 0%, #0099cc 100%)');
      root.style.setProperty('--app-scrollbar-thumb-hover', 'linear-gradient(180deg, #00e5ff 0%, #00aacc 100%)');
      
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    } else {
      // Light theme colors
      root.style.setProperty('--app-bg-primary', '#f5f5f5');
      root.style.setProperty('--app-bg-secondary', '#ffffff');
      root.style.setProperty('--app-bg-tertiary', '#fafafa');
      root.style.setProperty('--app-bg-card', 'rgba(255, 255, 255, 0.9)');
      root.style.setProperty('--app-bg-card-hover', 'rgba(255, 255, 255, 0.95)');
      root.style.setProperty('--app-bg-input', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--app-bg-table', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--app-bg-toolbar', 'rgba(255, 255, 255, 0.95)');
      root.style.setProperty('--app-bg-sidenav', 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.98) 100%)');
      
      root.style.setProperty('--app-text-primary', '#212121');
      root.style.setProperty('--app-text-secondary', 'rgba(33, 33, 33, 0.9)');
      root.style.setProperty('--app-text-tertiary', 'rgba(33, 33, 33, 0.7)');
      
      root.style.setProperty('--app-accent', '#1976d2');
      root.style.setProperty('--app-accent-hover', '#1565c0');
      root.style.setProperty('--app-accent-secondary', '#0d47a1');
      root.style.setProperty('--app-accent-alpha-1', 'rgba(25, 118, 210, 0.1)');
      root.style.setProperty('--app-accent-alpha-2', 'rgba(25, 118, 210, 0.2)');
      root.style.setProperty('--app-accent-alpha-3', 'rgba(25, 118, 210, 0.3)');
      root.style.setProperty('--app-accent-alpha-5', 'rgba(25, 118, 210, 0.5)');
      
      root.style.setProperty('--app-border', 'rgba(25, 118, 210, 0.2)');
      root.style.setProperty('--app-border-hover', 'rgba(25, 118, 210, 0.3)');
      
      root.style.setProperty('--app-shadow', 'rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--app-shadow-light', 'rgba(0, 0, 0, 0.1)');
      
      root.style.setProperty('--app-scrollbar-track', 'rgba(240, 240, 240, 0.8)');
      root.style.setProperty('--app-scrollbar-thumb', 'linear-gradient(180deg, #1976d2 0%, #0d47a1 100%)');
      root.style.setProperty('--app-scrollbar-thumb-hover', 'linear-gradient(180deg, #1565c0 0%, #0d47a1 100%)');
      
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    }
  }
}

