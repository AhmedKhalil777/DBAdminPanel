import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, EntityMetadata } from '../../services/api.service';
import { EntityFormComponent } from '../entity-form/entity-form.component';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    EntityFormComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './entity-table.component.html',
  styleUrl: './entity-table.component.css'
})
export class EntityTableComponent implements OnInit {
  @Input() entityMetadata!: EntityMetadata;
  
  data: any[] = [];
  displayedColumns: string[] = [];
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalItems = 0;
  showCreateForm = false;
  editingEntity: any = null;
  loading = false;
  columnsReady = false;

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.entityMetadata && this.entityMetadata.properties && this.entityMetadata.properties.length > 0) {
      this.setupDisplayedColumns();
      this.loadData();
    } else {
      this.displayedColumns = [];
    }
  }

  setupDisplayedColumns() {
    if (!this.entityMetadata || !this.entityMetadata.properties || this.entityMetadata.properties.length === 0) {
      this.displayedColumns = [];
      this.columnsReady = false;
      return;
    }
    // Ensure we only include columns that have properties with valid names
    const propertyNames = this.entityMetadata.properties
      .filter(p => p && p.name && typeof p.name === 'string' && p.name.trim() !== '')
      .map(p => p.name);
    
    this.displayedColumns = [
      ...propertyNames,
      'actions'
    ];
    
    // Mark columns as ready after change detection to ensure template is rendered
    this.cdr.detectChanges();
    setTimeout(() => {
      this.columnsReady = true;
      this.cdr.detectChanges();
    }, 0);
  }

  get validProperties() {
    if (!this.entityMetadata || !this.entityMetadata.properties) {
      return [];
    }
    return this.entityMetadata.properties.filter(
      p => p && p.name && typeof p.name === 'string' && p.name.trim() !== ''
    );
  }

  loadData() {
    if (!this.entityMetadata || !this.entityMetadata.name) {
      this.loading = false;
      return;
    }
    
    this.loading = true;
    this.apiService.getAllEntities(this.entityMetadata.name).subscribe({
      next: (data) => {
        this.data = data || [];
        this.totalItems = this.data.length;
        this.currentPage = 0;
        // Ensure displayedColumns are set before rendering
        if (this.displayedColumns.length === 0) {
          this.setupDisplayedColumns();
        } else {
          // Ensure columns are marked as ready
          this.columnsReady = true;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load data:', error);
        this.data = [];
        this.totalItems = 0;
        this.loading = false;
      }
    });
  }

  get paginatedData(): any[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.data.slice(start, end);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  createNew() {
    this.editingEntity = null;
    this.showCreateForm = true;
  }

  edit(entity: any) {
    this.editingEntity = { ...entity };
    this.showCreateForm = true;
  }

  delete(entity: any) {
    if (confirm(`Are you sure you want to delete this ${this.entityMetadata.name}?`)) {
      const id = entity[this.entityMetadata.keyProperty];
      this.apiService.deleteEntity(this.entityMetadata.name, String(id)).subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          console.error('Failed to delete:', error);
          alert('Failed to delete entity');
        }
      });
    }
  }

  onSave() {
    this.showCreateForm = false;
    this.editingEntity = null;
    this.loadData();
  }

  onCancel() {
    this.showCreateForm = false;
    this.editingEntity = null;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  getPropertyType(propName: string): string {
    const prop = this.entityMetadata.properties.find(p => p.name === propName);
    return prop?.type || 'string';
  }

  getPropertyIcon(type: string): string {
    if (!type) return 'code';
    const typeLower = type.toLowerCase();
    if (typeLower.includes('int') || typeLower.includes('number') || typeLower.includes('decimal')) {
      return 'numbers';
    }
    if (typeLower.includes('date') || typeLower.includes('time')) {
      return 'calendar_today';
    }
    if (typeLower.includes('bool')) {
      return 'toggle_on';
    }
    if (typeLower.includes('string') || typeLower.includes('text')) {
      return 'text_fields';
    }
    return 'code';
  }

  trackByPropertyName(index: number, prop: any): string {
    return (prop && prop.name && typeof prop.name === 'string') ? prop.name : `prop-${index}`;
  }
}
