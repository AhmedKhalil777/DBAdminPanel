import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, EntityMetadata } from '../services/api.service';
import { EntityTableComponent } from '../components/entity-table/entity-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, EntityTableComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  allMetadata: EntityMetadata[] = [];
  groupedMetadata: { [key: string]: EntityMetadata[] } = {};
  selectedEntity: EntityMetadata | null = null;
  selectedDbContext: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadMetadata();
  }

  loadMetadata() {
    this.apiService.getAllMetadata().subscribe({
      next: (data) => {
        this.allMetadata = data;
        this.groupByDbContext();
      },
      error: (error) => {
        console.error('Failed to load metadata:', error);
      }
    });
  }

  groupByDbContext() {
    this.groupedMetadata = {};
    this.allMetadata.forEach(entity => {
      const dbContext = entity.dbContextName || 'Unknown';
      if (!this.groupedMetadata[dbContext]) {
        this.groupedMetadata[dbContext] = [];
      }
      this.groupedMetadata[dbContext].push(entity);
    });
  }

  selectEntity(entity: EntityMetadata) {
    this.selectedEntity = entity;
  }

  selectDbContext(dbContext: string) {
    this.selectedDbContext = dbContext;
    // Select first entity in the context if none selected
    if (this.groupedMetadata[dbContext] && this.groupedMetadata[dbContext].length > 0) {
      this.selectedEntity = this.groupedMetadata[dbContext][0];
    }
  }

  get dbContexts(): string[] {
    return Object.keys(this.groupedMetadata).sort();
  }
}

