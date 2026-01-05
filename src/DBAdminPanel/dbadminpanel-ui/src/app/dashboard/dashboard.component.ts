import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService, EntityMetadata } from '../services/api.service';
import { EntityTableComponent } from '../components/entity-table/entity-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    EntityTableComponent,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatToolbarModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  allMetadata: EntityMetadata[] = [];
  groupedMetadata: { [key: string]: EntityMetadata[] } = {};
  selectedEntity: EntityMetadata | null = null;
  selectedDbContext: string | null = null;
  sidenavOpened = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadMetadata();
  }

  loadMetadata() {
    this.apiService.getAllMetadata().subscribe({
      next: (data) => {
        this.allMetadata = data;
        this.groupByDbContext();
        // Auto-select first entity if available
        if (this.allMetadata.length > 0 && !this.selectedEntity) {
          this.selectEntity(this.allMetadata[0]);
        }
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
      this.selectEntity(this.groupedMetadata[dbContext][0]);
    }
  }

  get dbContexts(): string[] {
    return Object.keys(this.groupedMetadata).sort();
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  getEntityCount(dbContext: string): number {
    return this.groupedMetadata[dbContext]?.length || 0;
  }
}

