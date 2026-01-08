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
import { TypeUtilsService } from '../services/type-utils.service';
import { AppThemeService } from '../services/app-theme.service';
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
  private typeUtils = inject(TypeUtilsService);
  private appThemeService = inject(AppThemeService);
  
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
  
  // Zoom and pan state
  zoomLevel = signal(1);
  panX = signal(0);
  panY = signal(0);
  isDragging = signal(false);
  dragStartX = 0;
  dragStartY = 0;
  
  // Computed zoom level percentage for display
  zoomLevelPercent = computed(() => Math.round(this.zoomLevel() * 100));
  
  private mermaidDiagramId = 'mermaid-diagram';
  private mermaidInitializedFlag = false;
  private routeSubscription: any;
  private svgElement: SVGSVGElement | null = null;
  private isRendering = false;
  private lastRenderedTheme: 'dark' | 'light' | null = null;
  private initialRenderComplete = false;
  private lastRenderedDataHash: string | null = null;
  private lastFilter: string | null = null;

  constructor() {
    // Initialize lastFilter to current filter to prevent initial trigger
    this.lastFilter = this.dbContextFilter();
    
    // Load diagram data
    this.loadDiagramData();
    
    // Single effect to handle all rendering scenarios
    effect(() => {
      const data = this.diagramData();
      const initialized = this.mermaidInitialized();
      const loading = this.isLoading();
      const filter = this.dbContextFilter();
      const theme = this.appThemeService.currentTheme();
      
      // Skip if not ready
      if (loading || !initialized || data.length === 0 || this.isRendering) {
        return;
      }
      
      const diagramElement = document.getElementById(this.mermaidDiagramId);
      const hasSvg = diagramElement?.querySelector('svg');
      
      // Check if filter changed - always rebuild on filter change
      if (filter !== this.lastFilter) {
        this.lastFilter = filter;
        this.destroyAndRebuild();
        return;
      }
      
      // Check if theme changed - re-render with new theme
      if (this.lastRenderedTheme !== theme && this.initialRenderComplete) {
        this.lastRenderedTheme = theme;
        this.updateMermaidTheme(theme);
        this.destroyAndRebuild();
        return;
      }
      
      // Check if data changed - re-render if data hash changed
      if (hasSvg && this.initialRenderComplete) {
        const currentDataHash = this.getDataHash(data);
        if (currentDataHash !== this.lastRenderedDataHash) {
          this.destroyAndRebuild();
          return;
        }
      }
      
      // Initial render - only if no SVG exists
      if (!hasSvg) {
        setTimeout(() => {
          if (!this.isRendering && !document.getElementById(this.mermaidDiagramId)?.querySelector('svg')) {
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
          const currentTheme = this.appThemeService.currentTheme();
          this.updateMermaidTheme(currentTheme);
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

  private updateMermaidTheme(appTheme: 'dark' | 'light') {
    const mermaidLib = (window as any).mermaid;
    if (!mermaidLib) return;

    const mermaidTheme = appTheme === 'dark' ? 'dark' : 'default';
    const strokeColor = appTheme === 'dark' ? '#e0e0e0' : '#666';
    const fillColor = appTheme === 'dark' ? '#1a1f3a' : '#fff';
    const textColor = appTheme === 'dark' ? '#e0e0e0' : '#212121';

    try {
      mermaidLib.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        themeVariables: {
          primaryColor: appTheme === 'dark' ? '#1a1f3a' : '#fff',
          primaryTextColor: textColor,
          primaryBorderColor: strokeColor,
          lineColor: strokeColor,
          secondaryColor: fillColor,
          tertiaryColor: appTheme === 'dark' ? '#0f1419' : '#f5f5f5',
          background: appTheme === 'dark' ? '#0a0e27' : '#fff',
          mainBkgColor: fillColor,
          secondBkgColor: appTheme === 'dark' ? '#0f1419' : '#fafafa',
          textColor: textColor,
          border1: strokeColor,
          border2: strokeColor,
          arrowheadColor: strokeColor,
          clusterBkg: fillColor,
          clusterBorder: strokeColor,
          defaultLinkColor: appTheme === 'dark' ? '#00d4ff' : '#1976d2',
          titleColor: textColor,
          edgeLabelBackground: appTheme === 'dark' ? '#1a1f3a' : '#fff',
          actorBorder: strokeColor,
          actorBkg: fillColor,
          actorTextColor: textColor,
          actorLineColor: strokeColor,
          signalColor: textColor,
          signalTextColor: textColor,
          labelBoxBkgColor: fillColor,
          labelBoxBorderColor: strokeColor,
          labelTextColor: textColor,
          loopTextColor: textColor,
          noteBorderColor: strokeColor,
          noteBkgColor: fillColor,
          noteTextColor: textColor,
          activationBorderColor: strokeColor,
          activationBkgColor: fillColor,
          sequenceNumberColor: textColor,
          sectionBkgColor: fillColor,
          altSectionBkgColor: fillColor,
          excludeBkgColor: appTheme === 'dark' ? '#0f1419' : '#f5f5f5',
          taskBorderColor: strokeColor,
          taskBkgColor: fillColor,
          taskTextLightColor: textColor,
          taskTextColor: textColor,
          taskTextDarkColor: textColor,
          taskTextOutsideColor: textColor,
          taskTextClickableColor: appTheme === 'dark' ? '#00d4ff' : '#1976d2',
          activeTaskBorderColor: strokeColor,
          activeTaskBkgColor: fillColor,
          gridColor: strokeColor,
          doneTaskBkgColor: appTheme === 'dark' ? '#0f1419' : '#f5f5f5',
          doneTaskBorderColor: strokeColor,
          critBorderColor: appTheme === 'dark' ? '#ff4444' : '#d32f2f',
          critBkgColor: fillColor,
          taskTextFontSize: '16px',
          taskTextFontFamily: 'trebuchet ms, verdana, arial',
          taskTextFontWeight: 'normal',
          activeTaskBorderColor2: strokeColor,
          doneTaskBorderColor2: strokeColor,
          critBorderColor2: appTheme === 'dark' ? '#ff4444' : '#d32f2f',
          activeTaskBorderColor3: strokeColor,
          doneTaskBorderColor3: strokeColor,
          critBorderColor3: appTheme === 'dark' ? '#ff4444' : '#d32f2f',
          personBorder: strokeColor,
          personBkg: fillColor
        },
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
          stroke: strokeColor,
          fill: fillColor
        }
      });
    } catch (err) {
      console.error('Failed to update Mermaid theme:', err);
    }
  }

  private renderDiagram() {
    // Prevent multiple simultaneous renders
    if (this.isRendering) {
      console.warn('Render already in progress, skipping');
      return;
    }

    // Double-check conditions before rendering
    if (!this.mermaidInitialized()) {
      console.warn('Mermaid not initialized yet');
      this.isRendering = false;
      return;
    }
    
    const data = this.diagramData();
    if (data.length === 0) {
      console.warn('No diagram data to render');
      this.isRendering = false;
      return;
    }

    if (this.isLoading()) {
      console.warn('Still loading, skipping render');
      this.isRendering = false;
      return;
    }

    this.isRendering = true;

    // Wait for the element to exist in the DOM
    let retryCount = 0;
    const maxRetries = 50; // Max 5 seconds of retries
    const checkElement = () => {
      const diagramElement = document.getElementById(this.mermaidDiagramId);
      if (!diagramElement) {
        retryCount++;
        if (retryCount > maxRetries) {
          console.error('Diagram element not found after max retries');
          this.isRendering = false;
          return;
        }
        console.warn('Diagram element not found, retrying...');
        setTimeout(checkElement, 100);
        return;
      }

      // Verify element is in the DOM
      if (!diagramElement.isConnected) {
        retryCount++;
        if (retryCount > maxRetries) {
          console.error('Diagram element not connected after max retries');
          this.isRendering = false;
          return;
        }
        console.warn('Diagram element not connected to DOM, retrying...');
        setTimeout(checkElement, 100);
        return;
      }

      try {
        // Generate Mermaid ER diagram syntax
        const mermaidSyntax = this.generateMermaidSyntax();
        if (!mermaidSyntax || mermaidSyntax.trim().length === 0) {
          console.warn('Empty Mermaid syntax generated');
          this.isRendering = false;
          return;
        }
        
        console.log('Rendering diagram with syntax length:', mermaidSyntax.length);
        
        // Create a unique ID for this render
        const renderId = `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Clear previous content and set the Mermaid syntax
        diagramElement.innerHTML = '';
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
              this.isRendering = false;
              this.initialRenderComplete = true;
              this.lastRenderedTheme = this.appThemeService.currentTheme();
              this.lastRenderedDataHash = this.getDataHash(this.diagramData());
              this.setupZoomAndPan();
            }).catch((err: any) => {
              console.error('Mermaid runAsync error:', err);
              this.isRendering = false;
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
              this.isRendering = false;
              this.initialRenderComplete = true;
              this.lastRenderedTheme = this.appThemeService.currentTheme();
              this.lastRenderedDataHash = this.getDataHash(this.diagramData());
              this.setupZoomAndPan();
            }).catch((err: any) => {
              console.error('Mermaid run error:', err);
              this.isRendering = false;
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
        this.isRendering = false;
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
          this.isRendering = false;
          this.initialRenderComplete = true;
          this.lastRenderedTheme = this.appThemeService.currentTheme();
          this.lastRenderedDataHash = this.getDataHash(this.diagramData());
          this.setupZoomAndPan();
        } else {
          this.isRendering = false;
        }
      });
    } else {
      this.isRendering = false;
    }
  }

  private setupZoomAndPan() {
    setTimeout(() => {
      const diagramElement = document.getElementById(this.mermaidDiagramId);
      if (!diagramElement) return;

      // Find the SVG element
      const svg = diagramElement.querySelector('svg') as SVGSVGElement;
      if (!svg) return;

      this.svgElement = svg;
      
      // Reset zoom and pan
      this.zoomLevel.set(1);
      this.panX.set(0);
      this.panY.set(0);
      this.applyTransform();

      // Add mouse wheel zoom
      diagramElement.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, this.zoomLevel() * delta));
        this.zoomLevel.set(newZoom);
        this.applyTransform();
      });

      // Add drag to pan
      diagramElement.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.button === 0) { // Left mouse button
          this.isDragging.set(true);
          this.dragStartX = e.clientX - this.panX();
          this.dragStartY = e.clientY - this.panY();
          diagramElement.style.cursor = 'grabbing';
        }
      });

      document.addEventListener('mousemove', (e: MouseEvent) => {
        if (this.isDragging()) {
          this.panX.set(e.clientX - this.dragStartX);
          this.panY.set(e.clientY - this.dragStartY);
          this.applyTransform();
        }
      });

      document.addEventListener('mouseup', () => {
        if (this.isDragging()) {
          this.isDragging.set(false);
          if (diagramElement) {
            diagramElement.style.cursor = 'grab';
          }
        }
      });

      // Set initial cursor
      diagramElement.style.cursor = 'grab';
    }, 100);
  }

  private applyTransform() {
    if (!this.svgElement) return;
    
    const zoom = this.zoomLevel();
    const x = this.panX();
    const y = this.panY();
    
    this.svgElement.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    this.svgElement.style.transformOrigin = '0 0';
  }

  zoomIn() {
    const newZoom = Math.min(5, this.zoomLevel() * 1.2);
    this.zoomLevel.set(newZoom);
    this.applyTransform();
  }

  zoomOut() {
    const newZoom = Math.max(0.1, this.zoomLevel() * 0.8);
    this.zoomLevel.set(newZoom);
    this.applyTransform();
  }

  resetZoom() {
    this.zoomLevel.set(1);
    this.panX.set(0);
    this.panY.set(0);
    this.applyTransform();
  }

  saveSvg() {
    const diagramElement = document.getElementById(this.mermaidDiagramId);
    if (!diagramElement) return;

    const svg = diagramElement.querySelector('svg') as SVGSVGElement;
    if (!svg) {
      alert('No diagram to save. Please wait for the diagram to render.');
      return;
    }

    try {
      // Clone the SVG to avoid modifying the original
      const svgClone = svg.cloneNode(true) as SVGSVGElement;
      
      // Remove transform styles from clone (we want the original scale)
      svgClone.style.transform = '';
      svgClone.style.transformOrigin = '';

      // Get SVG as string
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgClone);

      // Add XML declaration
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;

      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `database-diagram-${timestamp}.svg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save SVG:', err);
      alert('Failed to save diagram. Please try again.');
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
        
        // Mermaid ER diagrams: prioritize PK over FK (can't have both on same line)
        // If it's both PK and FK, just mark as PK since PK is more important
        if (column.isPrimaryKey) {
          columnDef += ' PK';
        } else if (column.isForeignKey) {
          columnDef += ' FK';
        }
        
        // Add "not null" constraint only for non-PK columns (PKs are implicitly not null)
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
    // Use the type utility service to normalize and format the type
    return this.typeUtils.formatTypeForDiagram(type);
  }

  refreshDiagram() {
    this.loadDiagramData();
  }

  /**
   * Destroy the current diagram and rebuild it from scratch
   */
  private destroyAndRebuild() {
    if (this.isRendering) {
      return; // Already rendering
    }

    // Reset all state first
    this.lastRenderedDataHash = null;
    this.initialRenderComplete = false;
    
    // Clear existing diagram completely
    const diagramElement = document.getElementById(this.mermaidDiagramId);
    if (diagramElement) {
      // Remove all content including SVG
      diagramElement.innerHTML = '';
      diagramElement.classList.remove('mermaid');
      diagramElement.removeAttribute('data-processed');
    }
    
    // Reset zoom and pan
    this.zoomLevel.set(1);
    this.panX.set(0);
    this.panY.set(0);
    
    // Clear SVG element reference
    this.svgElement = null;
    
    // Rebuild with current data after a short delay
    setTimeout(() => {
      if (this.diagramData().length > 0 && !this.isLoading() && !this.isRendering) {
        this.renderDiagram();
      }
    }, 200);
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

  /**
   * Generate a hash of the diagram data to detect if it actually changed
   */
  private getDataHash(data: DiagramTableInfo[]): string {
    if (!data || data.length === 0) return 'empty';
    
    // Create a simple hash based on table names, column counts, and relation counts
    const hashParts = data.map(table => 
      `${table.name}:${table.columns.length}:${table.relations.length}`
    ).sort().join('|');
    
    // Add filter to hash if present
    const filter = this.dbContextFilter();
    return filter ? `${filter}:${hashParts}` : hashParts;
  }
}

