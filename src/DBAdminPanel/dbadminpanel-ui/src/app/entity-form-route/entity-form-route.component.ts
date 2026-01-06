import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, EntityMetadata } from '../services/api.service';
import { EntityFormComponent } from '../components/entity-form/entity-form.component';

@Component({
  selector: 'app-entity-form-route',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    EntityFormComponent
  ],
  templateUrl: './entity-form-route.component.html',
  styleUrl: './entity-form-route.component.css'
})
export class EntityFormRouteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  entityName = signal<string>('');
  entityId = signal<string | null>(null);
  entityMetadata = signal<EntityMetadata | null>(null);
  entity = signal<any>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isEditMode = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const encodedName = params.get('entityName');
      const id = params.get('id');
      
      if (encodedName) {
        const name = decodeURIComponent(encodedName);
        this.entityName.set(name);
        this.entityId.set(id);
        this.isEditMode.set(!!id);
        
        this.loadEntityMetadata(name);
        
        if (id) {
          this.loadEntity(id, name);
        }
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
          if (!this.isEditMode()) {
            this.isLoading.set(false);
          }
        } else {
          this.error.set(`Entity "${entityName}" not found`);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load entity metadata:', err);
        this.error.set('Failed to load entity metadata');
        this.isLoading.set(false);
      }
    });
  }

  loadEntity(id: string, entityName: string) {
    this.apiService.getEntityById(entityName, id).subscribe({
      next: (data) => {
        this.entity.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load entity:', err);
        this.error.set('Failed to load entity');
        this.isLoading.set(false);
      }
    });
  }

  onSave() {
    // Navigate back to entity view after save
    const encodedName = encodeURIComponent(this.entityName());
    this.router.navigate(['entity', encodedName]);
  }

  onCancel() {
    // Navigate back to entity view
    const encodedName = encodeURIComponent(this.entityName());
    this.router.navigate(['entity', encodedName]);
  }
}

