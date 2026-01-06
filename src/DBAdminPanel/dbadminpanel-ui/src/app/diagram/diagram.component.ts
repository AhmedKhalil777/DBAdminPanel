import { Component, inject, signal, computed, effect, input, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, DiagramTableInfo } from '../services/api.service';
import { catchError, of } from 'rxjs';
import { filter } from 'rxjs/operators';

// Mermaid is loaded via script tag in index.html

@Component({
  selector: 'app-diagram',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.css'
})
export class DiagramComponent implements AfterViewInit, OnDestroy {
  private apiService = inject(ApiService);
  private router = inject(Router);
  
  // Optional DB context filter
  dbContextFilter = input<string | null>(null);
  
  // Option to hide toolbar when embedded
  hideToolbar = input<boolean>(false);
  
  allDiagramData = signal<DiagramTableInfo[]>([]);
  diagramData = computed(() => {
    const filter = this.dbContextFilter();
    const allData = this.allDiagramData();
    if (!filter) {
      return allData;
    }
    return allData.filter(table => table.dbContextName === filter);
  });
  
  isLoading = signal(true);
  error = signal<string | null>(null);
  mermaidInitialized = signal(false);
  
  private mermaidDiagramId = 'mermaid-diagram';
  private mermaidInitializedFlag = false;
  private routeSubscription: any;

  constructor() {
    // Load diagram data
    this.loadDiagramData();
    
    // Listen to route changes to re-render diagram
    this.routeSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Re-render diagram when route changes
      if (this.mermaidInitialized() && this.diagramData().length > 0 && !this.isLoading()) {
        setTimeout(() => {
          this.renderDiagram();
        }, 300);
      }
    });
    
    // Initialize Mermaid when data is loaded
    effect(() => {
      const data = this.diagramData();
      const initialized = this.mermaidInitialized();
      const loading = this.isLoading();
      
      // Only render if we have data, Mermaid is initialized, and we're not loading
      if (!loading && data.length > 0 && initialized) {
        // Use a longer delay to ensure DOM is ready
        setTimeout(() => {
          const element = document.getElementById(this.mermaidDiagramId);
          if (element) {
            this.renderDiagram();
          }
        }, 300);
      }
    });
  }

  ngAfterViewInit() {
    this.initializeMermaid();
  }

  ngOnDestroy() {
    // Cleanup route subscription
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    
    // Cleanup Mermaid diagram element
    const diagramElement = document.getElementById(this.mermaidDiagramId);
    if (diagramElement) {
      diagramElement.innerHTML = '';
      diagramElement.classList.remove('mermaid');
    }
  }

  private loadDiagramData() {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.apiService.getDiagramData().pipe(
      catchError(err => {
        console.error('Failed to load diagram data:', err);
        this.error.set('Failed to load diagram data. Please try again later.');
        this.isLoading.set(false);
        return of([]);
      })
    ).subscribe(data => {
      console.log('API Response:', data);
      console.log('Loaded data:', data);
      console.log('Total items:', data.length);
      this.allDiagramData.set(data);
      this.isLoading.set(false);
      
      if (data.length === 0) {
        console.warn('No diagram data received from API - endpoint may be returning empty array');
        this.error.set('No diagram data available. The endpoint returned an empty array. Please check server logs.');
      }
      // Don't try to render here - let the effect handle it
    });
  }

  private initializeMermaid() {
    if (this.mermaidInitializedFlag) return;
    
    // Check if D3 and Mermaid are available (loaded via script tags)
    const checkMermaid = () => {
      // First check if D3 is available (required by Mermaid)
      if (typeof (window as any).d3 === 'undefined') {
        console.warn('D3.js not loaded yet, retrying...');
        setTimeout(checkMermaid, 100);
        return;
      }
      
      if (typeof (window as any).mermaid !== 'undefined') {
        try {
          (window as any).mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            },
            er: {
              layoutDirection: 'TB',
              minEntityWidth: 100,
              minEntityHeight: 75,
              entityPadding: 15,
              stroke: '#666',
              fill: '#fff'
            }
          });
          this.mermaidInitializedFlag = true;
          this.mermaidInitialized.set(true);
          console.log('Mermaid initialized successfully');
        } catch (err) {
          console.error('Failed to initialize Mermaid:', err);
          this.error.set('Failed to initialize diagram library.');
        }
      } else {
        // Retry after a short delay if mermaid hasn't loaded yet
        setTimeout(checkMermaid, 100);
      }
    };
    
    checkMermaid();
  }

  private renderDiagram() {
    // Double-check conditions before rendering
    if (!this.mermaidInitialized()) {
      console.warn('Mermaid not initialized yet');
      return;
    }
    
    const data = this.diagramData();
    if (data.length === 0) {
      console.warn('No diagram data to render');
      return;
    }

    if (this.isLoading()) {
      console.warn('Still loading, skipping render');
      return;
    }

    // Wait for the element to exist in the DOM
    const checkElement = () => {
      const diagramElement = document.getElementById(this.mermaidDiagramId);
      if (!diagramElement) {
        console.warn('Diagram element not found, retrying...');
        setTimeout(checkElement, 100);
        return;
      }

      // Verify element is in the DOM
      if (!diagramElement.isConnected) {
        console.warn('Diagram element not connected to DOM, retrying...');
        setTimeout(checkElement, 100);
        return;
      }

      try {
        // Generate Mermaid ER diagram syntax
        const mermaidSyntax = this.generateMermaidSyntax();
        if (!mermaidSyntax || mermaidSyntax.trim().length === 0) {
          console.warn('Empty Mermaid syntax generated');
          return;
        }
        
        console.log('Rendering diagram with syntax length:', mermaidSyntax.length);
        
        // Clear previous content
        diagramElement.innerHTML = '';
        
        // Create a unique ID for this render
        const renderId = `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Set the Mermaid syntax in the element and add mermaid class
        diagramElement.textContent = mermaidSyntax;
        diagramElement.classList.add('mermaid');
        
        // Render with Mermaid - use runAsync for better error handling
        const mermaidLib = (window as any).mermaid;
        if (mermaidLib) {
          // Check if D3 is available (required by Mermaid)
          if (typeof (window as any).d3 === 'undefined') {
            throw new Error('D3.js is required but not loaded. Please refresh the page.');
          }
          
          // Use runAsync if available (newer Mermaid API)
          if (mermaidLib.runAsync) {
            mermaidLib.runAsync({
              querySelector: `#${this.mermaidDiagramId}`,
              suppressErrors: false
            }).then(() => {
              console.log('Diagram rendered successfully');
            }).catch((err: any) => {
              console.error('Mermaid runAsync error:', err);
              // Fallback to render method
              this.renderWithLegacyApi(diagramElement, renderId, mermaidSyntax);
            });
          } else if (mermaidLib.run) {
            // Use run method
            mermaidLib.run({
              querySelector: `#${this.mermaidDiagramId}`,
              suppressErrors: false
            }).then(() => {
              console.log('Diagram rendered successfully with run');
            }).catch((err: any) => {
              console.error('Mermaid run error:', err);
              // Fallback to legacy render method
              this.renderWithLegacyApi(diagramElement, renderId, mermaidSyntax);
            });
          } else {
            // Fallback to legacy render API
            this.renderWithLegacyApi(diagramElement, renderId, mermaidSyntax);
          }
        } else {
          throw new Error('Mermaid is not available');
        }
      } catch (err) {
        console.error('Failed to render diagram:', err);
        this.error.set('Failed to render diagram. Please refresh the page.');
      }
    };
    
    checkElement();
  }

  private renderWithLegacyApi(element: HTMLElement, renderId: string, syntax: string) {
    const mermaidLib = (window as any).mermaid;
    if (mermaidLib && mermaidLib.render) {
      mermaidLib.render(renderId, syntax, (svgCode: string) => {
        if (element && element.isConnected) {
          element.innerHTML = svgCode;
          console.log('Diagram rendered with legacy API');
        }
      });
    }
  }

  private generateMermaidSyntax(): string {
    const tables = this.diagramData();
    if (tables.length === 0) return 'erDiagram\n    EMPTY "No tables found"';
    
    // Filter relations to only include tables that are in the filtered set
    const tableNames = new Set(tables.map(t => this.sanitizeTableName(t.tableName)));

    let syntax = 'erDiagram\n';
    
    // Add table definitions
    tables.forEach(table => {
      syntax += `    ${this.sanitizeTableName(table.tableName)} {\n`;
      
      table.columns.forEach(column => {
        const columnName = this.sanitizeColumnName(column.name);
        const columnType = this.formatColumnType(column.type);
        let columnDef = `        ${columnType} ${columnName}`;
        
        if (column.isPrimaryKey) {
          columnDef += ' PK';
        }
        if (column.isForeignKey) {
          columnDef += ' FK';
        }
        if (!column.isNullable && !column.isPrimaryKey) {
          columnDef += ' "not null"';
        }
        
        syntax += columnDef + '\n';
      });
      
      syntax += '    }\n';
    });

    // Add relationships (only between tables in the filtered set)
    tables.forEach(table => {
      table.relations.forEach(relation => {
        const fromTable = this.sanitizeTableName(relation.fromTable);
        const toTable = this.sanitizeTableName(relation.toTable);
        // Only include relations where both tables are in the filtered set
        if (tableNames.has(fromTable) && tableNames.has(toTable)) {
          const relationship = relation.relationshipType === 'OneToOne' ? '||--||' : '||--o{';
          syntax += `    ${fromTable} ${relationship} ${toTable} : "${relation.fromColumn} -> ${relation.toColumn}"\n`;
        }
      });
    });

    return syntax;
  }

  private sanitizeTableName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private sanitizeColumnName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private formatColumnType(type: string): string {
    // Map common types to shorter names for diagram
    const typeMap: { [key: string]: string } = {
      'Int32': 'int',
      'Int64': 'long',
      'String': 'string',
      'Boolean': 'bool',
      'DateTime': 'datetime',
      'Decimal': 'decimal',
      'Double': 'double',
      'Single': 'float',
      'Guid': 'guid',
      'Byte': 'byte'
    };
    
    return typeMap[type] || type.toLowerCase();
  }

  refreshDiagram() {
    this.loadDiagramData();
  }

  getTableCount(): number {
    return this.diagramData().length;
  }

  getRelationCount(): number {
    const tables = this.diagramData();
    const tableNames = new Set(tables.map(t => this.sanitizeTableName(t.tableName)));
    return tables.reduce((sum, table) => {
      // Only count relations where both tables are in the filtered set
      const validRelations = table.relations.filter(rel => {
        const fromTable = this.sanitizeTableName(rel.fromTable);
        const toTable = this.sanitizeTableName(rel.toTable);
        return tableNames.has(fromTable) && tableNames.has(toTable);
      });
      return sum + validRelations.length;
    }, 0);
  }
}

