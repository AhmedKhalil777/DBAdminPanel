import { Component, input, signal, computed, effect, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { MatTable } from '@angular/material/table';
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
export class EntityTableComponent {
  entityMetadata = input.required<EntityMetadata>();
  @ViewChild(MatTable) table!: MatTable<any>;
  
  // Signals for reactive state
  data = signal<any[]>([]);
  displayedColumns = signal<string[]>([]);
  currentPage = signal(0);
  pageSize = signal(10);
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalItems = signal(0);
  showCreateForm = signal(false);
  editingEntity = signal<any>(null);
  isLoading = signal(false);
  columnsReady = signal(false);
  
  private previousEntityName: string | null = null;

  // Computed signals
  hasData = computed(() => this.data().length > 0);
  isEmpty = computed(() => !this.isLoading() && this.data().length === 0);
  showTable = computed(() => !this.isLoading() && this.displayedColumns().length > 0 && this.columnsReady() && this.hasData());

  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Effect to handle entity metadata changes
    effect(() => {
      const metadata = this.entityMetadata();
      if (metadata && metadata.properties && metadata.properties.length > 0) {
        const currentEntityName = metadata.name;
        
        // Only reload if the entity name actually changed
        if (currentEntityName !== this.previousEntityName) {
          this.previousEntityName = currentEntityName;
          
          // Reset state for new entity
          this.data.set([]);
          this.displayedColumns.set([]);
          this.currentPage.set(0);
          this.totalItems.set(0);
          this.showCreateForm.set(false);
          this.editingEntity.set(null);
          this.columnsReady.set(false);
          this.isLoading.set(true);
          
          this.setupDisplayedColumns();
          this.loadData();
        }
      } else {
        this.displayedColumns.set([]);
        this.columnsReady.set(false);
      }
    });
  }


  setupDisplayedColumns() {
    const metadata = this.entityMetadata();
    if (!metadata || !metadata.properties || metadata.properties.length === 0) {
      this.displayedColumns.set([]);
      this.columnsReady.set(false);
      return;
    }
    // Ensure we only include columns that have properties with valid names
    const propertyNames = metadata.properties
      .filter(p => p && p.name && typeof p.name === 'string' && p.name.trim() !== '')
      .map(p => p.name);
    
    this.displayedColumns.set([
      ...propertyNames,
      'actions'
    ]);
    
    // Mark columns as ready after change detection to ensure template is rendered
    // Use requestAnimationFrame to ensure DOM is updated before marking as ready
    this.columnsReady.set(false);
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.columnsReady.set(true);
        this.cdr.detectChanges();
      });
    });
  }

  validProperties = computed(() => {
    const metadata = this.entityMetadata();
    if (!metadata || !metadata.properties) {
      return [];
    }
    return metadata.properties.filter(
      p => p && p.name && typeof p.name === 'string' && p.name.trim() !== ''
    );
  });

  loadData() {
    const metadata = this.entityMetadata();
    if (!metadata || !metadata.name) {
      this.isLoading.set(false);
      return;
    }
    
    this.isLoading.set(true);
    // Use 1-based page index for API (Material paginator uses 0-based)
    const apiPage = this.currentPage() + 1;
    this.apiService.getAllEntities(metadata.name, apiPage, this.pageSize()).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.data.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        console.log('Loaded data:', this.data());
        console.log('Total items:', this.totalItems());
        console.log('Entity metadata properties:', metadata.properties);
        
        // Ensure displayedColumns are set before rendering
        if (this.displayedColumns().length === 0) {
          this.setupDisplayedColumns();
        } else {
          // Reset columnsReady and wait for column definitions to be registered
          this.columnsReady.set(false);
          this.cdr.detectChanges();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this.columnsReady.set(true);
              this.cdr.detectChanges();
            });
          });
        }
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load data:', error);
        this.data.set([]);
        this.totalItems.set(0);
        this.isLoading.set(false);
        this.columnsReady.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  paginatedData = computed(() => {
    // Data is already paginated from the server
    return this.data();
  });

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    // Reload data with new pagination parameters
    this.loadData();
  }

  createNew() {
    this.editingEntity.set(null);
    this.showCreateForm.set(true);
  }

  edit(entity: any) {
    this.editingEntity.set({ ...entity });
    this.showCreateForm.set(true);
  }

  delete(entity: any) {
    const metadata = this.entityMetadata();
    if (confirm(`Are you sure you want to delete this ${metadata.name}?`)) {
      const id = entity[metadata.keyProperty];
      this.apiService.deleteEntity(metadata.name, String(id)).subscribe({
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
    this.showCreateForm.set(false);
    this.editingEntity.set(null);
    this.loadData();
  }

  onCancel() {
    this.showCreateForm.set(false);
    this.editingEntity.set(null);
  }

  getRowValue(row: any, propertyName: string): any {
    if (!row || !propertyName) return null;
    
    // Try exact match first
    if (row.hasOwnProperty(propertyName)) {
      return row[propertyName];
    }
    
    // Try case-insensitive match
    const lowerPropName = propertyName.toLowerCase();
    for (const key in row) {
      if (row.hasOwnProperty(key) && key.toLowerCase() === lowerPropName) {
        return row[key];
      }
    }
    
    // Try camelCase if property is PascalCase
    const camelCase = propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
    if (row.hasOwnProperty(camelCase)) {
      return row[camelCase];
    }
    
    // Try PascalCase if property is camelCase
    const pascalCase = propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
    if (row.hasOwnProperty(pascalCase)) {
      return row[pascalCase];
    }
    
    return null;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return String(value);
  }

  getPropertyType(propName: string): string {
    const metadata = this.entityMetadata();
    const prop = metadata.properties.find(p => p.name === propName);
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
