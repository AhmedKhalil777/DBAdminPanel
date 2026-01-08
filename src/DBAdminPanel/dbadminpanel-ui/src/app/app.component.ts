import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppThemeService } from './services/app-theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'DB Admin Panel';
  
  // Initialize theme service to apply theme on app startup
  private themeService = inject(AppThemeService);
  
  constructor() {
    // Theme is automatically applied via the service's effect
  }
}
