import { Injectable, signal } from '@angular/core';

export interface SqlTheme {
  name: string;
  displayName: string;
  colors: {
    keyword: string;
    function: string;
    string: string;
    number: string;
    comment: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SqlThemeService {
  private readonly STORAGE_KEY = 'dbadminpanel_sql_theme';
  
  private readonly themes: SqlTheme[] = [
    {
      name: 'default',
      displayName: 'Default (Cyan)',
      colors: {
        keyword: '#00d4ff',
        function: '#4fc3f7',
        string: '#81c784',
        number: '#ffb74d',
        comment: '#78909c'
      }
    },
    {
      name: 'monokai',
      displayName: 'Monokai',
      colors: {
        keyword: '#f92672',
        function: '#66d9ef',
        string: '#e6db74',
        number: '#ae81ff',
        comment: '#75715e'
      }
    },
    {
      name: 'dracula',
      displayName: 'Dracula',
      colors: {
        keyword: '#ff79c6',
        function: '#8be9fd',
        string: '#f1fa8c',
        number: '#bd93f9',
        comment: '#6272a4'
      }
    },
    {
      name: 'github',
      displayName: 'GitHub',
      colors: {
        keyword: '#d73a49',
        function: '#6f42c1',
        string: '#032f62',
        number: '#005cc5',
        comment: '#6a737d'
      }
    },
    {
      name: 'solarized-dark',
      displayName: 'Solarized Dark',
      colors: {
        keyword: '#859900',
        function: '#268bd2',
        string: '#2aa198',
        number: '#b58900',
        comment: '#586e75'
      }
    },
    {
      name: 'one-dark',
      displayName: 'One Dark',
      colors: {
        keyword: '#c678dd',
        function: '#61afef',
        string: '#98c379',
        number: '#e5c07b',
        comment: '#5c6370'
      }
    },
    {
      name: 'nord',
      displayName: 'Nord',
      colors: {
        keyword: '#81a1c1',
        function: '#88c0d0',
        string: '#a3be8c',
        number: '#ebcb8b',
        comment: '#616e88'
      }
    }
  ];

  currentTheme = signal<SqlTheme>(this.getDefaultTheme());

  constructor() {
    // Load theme from localStorage on service initialization
    this.loadTheme();
  }

  getThemes(): SqlTheme[] {
    return this.themes;
  }

  getDefaultTheme(): SqlTheme {
    return this.themes[0];
  }

  setTheme(themeName: string): void {
    const theme = this.themes.find(t => t.name === themeName);
    if (theme) {
      this.currentTheme.set(theme);
      this.saveTheme(themeName);
      this.applyTheme(theme);
    }
  }

  loadTheme(): void {
    try {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      if (savedTheme) {
        const theme = this.themes.find(t => t.name === savedTheme);
        if (theme) {
          this.currentTheme.set(theme);
          this.applyTheme(theme);
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    
    // Use default theme
    this.applyTheme(this.getDefaultTheme());
  }

  private saveTheme(themeName: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, themeName);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  applyTheme(theme: SqlTheme): void {
    const root = document.documentElement;
    root.style.setProperty('--sql-keyword-color', theme.colors.keyword);
    root.style.setProperty('--sql-function-color', theme.colors.function);
    root.style.setProperty('--sql-string-color', theme.colors.string);
    root.style.setProperty('--sql-number-color', theme.colors.number);
    root.style.setProperty('--sql-comment-color', theme.colors.comment);
  }
}

