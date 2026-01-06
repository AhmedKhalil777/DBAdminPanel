import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService, EntityMetadata } from '../services/api.service';
import { DiagramComponent } from '../diagram/diagram.component';

@Component({
  selector: 'app-dbcontext-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    DiagramComponent
  ],
  templateUrl: './dbcontext-view.component.html',
  styleUrl: './dbcontext-view.component.css'
})
export class DbContextViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  dbContextName = signal<string>('');
  allMetadata = signal<EntityMetadata[]>([]);
  contextMetadata = computed(() => {
    const name = this.dbContextName();
    const metadata = this.allMetadata();
    if (!name) return null;
    
    const entities = metadata.filter(e => e.dbContextName === name);
    if (entities.length === 0) return null;
    
    return {
      name,
      entityCount: entities.length,
      entities
    };
  });

  ngOnInit() {
    // Subscribe to parameter changes for navigation between DB contexts
    this.route.paramMap.subscribe(params => {
      const dbContext = params.get('dbContext');
      if (dbContext) {
        const decodedContext = decodeURIComponent(dbContext);
        // Only update if the context name actually changed
        if (this.dbContextName() !== decodedContext) {
          this.dbContextName.set(decodedContext);
          this.loadMetadata();
        }
      } else {
        // Redirect to dashboard if no DB context provided
        this.router.navigate(['/']);
      }
    });
  }

  loadMetadata() {
    this.apiService.getAllMetadata().subscribe({
      next: (data) => {
        this.allMetadata.set(data);
      },
      error: (error) => {
        console.error('Failed to load metadata:', error);
      }
    });
  }

  selectEntity(entity: EntityMetadata) {
    // Navigate to entity view - you might want to create a route for this too
    // For now, we'll just navigate back to dashboard with entity selection
    this.router.navigate(['/'], { 
      queryParams: { entity: entity.name } 
    });
  }
}

