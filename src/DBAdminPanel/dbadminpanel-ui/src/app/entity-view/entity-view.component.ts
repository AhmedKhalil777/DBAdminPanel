import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService, EntityMetadata } from '../services/api.service';
import { EntityTableComponent } from '../components/entity-table/entity-table.component';
import { SqlExecutionComponent } from '../components/sql-execution/sql-execution.component';

@Component({
  selector: 'app-entity-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    EntityTableComponent,
    SqlExecutionComponent
  ],
  templateUrl: './entity-view.component.html',
  styleUrl: './entity-view.component.css'
})
export class EntityViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  entityName = signal<string>('');
  entityMetadata = signal<EntityMetadata | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const encodedName = params.get('entityName');
      if (encodedName) {
        const name = decodeURIComponent(encodedName);
        this.entityName.set(name);
        this.loadEntityMetadata(name);
      }
    });
  }

  loadEntityMetadata(entityName: string) {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.apiService.getAllMetadata().subscribe({
      next: (allMetadata) => {
        const metadata = allMetadata.find(e => e.name === entityName);
        if (metadata) {
          this.entityMetadata.set(metadata);
        } else {
          this.error.set(`Entity "${entityName}" not found`);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load entity metadata:', err);
        this.error.set('Failed to load entity metadata');
        this.isLoading.set(false);
      }
    });
  }
}

