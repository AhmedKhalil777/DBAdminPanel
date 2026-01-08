import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, EntityMetadata } from '../services/api.service';
import { EntityTableComponent } from '../components/entity-table/entity-table.component';
import { AppThemeService } from '../services/app-theme.service';
import { filter } from 'rxjs/operators';

interface TreeNode {
  name: string;
  type: 'dbcontext' | 'entity';
  dbContext?: string;
  entity?: EntityMetadata;
  children?: TreeNode[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    RouterModule,
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
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  allMetadata = signal<EntityMetadata[]>([]);
  groupedMetadata = signal<{ [key: string]: EntityMetadata[] }>({});
  selectedEntity = signal<EntityMetadata | null>(null);
  selectedDbContext = signal<string | null>(null);
  
  treeData = signal<TreeNode[]>([]);
  expandedNodes = signal<Set<string>>(new Set());
  
  router = inject(Router);
  route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  themeService = inject(AppThemeService);
  
  constructor() {
    // Listen to route changes to update selected entity
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateSelectedFromRoute();
    });
  }

  ngOnInit() {
    this.loadMetadata();
    this.updateSelectedFromRoute();
  }

  isExpanded(node: TreeNode): boolean {
    return this.expandedNodes().has(node.name);
  }

  toggleNode(node: TreeNode) {
    const expanded = new Set(this.expandedNodes());
    if (expanded.has(node.name)) {
      expanded.delete(node.name);
    } else {
      expanded.add(node.name);
    }
    this.expandedNodes.set(expanded);
  }

  loadMetadata() {
    this.apiService.getAllMetadata().subscribe({
      next: (data) => {
        this.allMetadata.set(data);
        this.groupByDbContext();
        this.buildTreeData();
      },
      error: (error) => {
        console.error('Failed to load metadata:', error);
      }
    });
  }

  groupByDbContext() {
    const grouped: { [key: string]: EntityMetadata[] } = {};
    this.allMetadata().forEach(entity => {
      const dbContext = entity.dbContextName || 'Unknown';
      if (!grouped[dbContext]) {
        grouped[dbContext] = [];
      }
      grouped[dbContext].push(entity);
    });
    this.groupedMetadata.set(grouped);
  }

  buildTreeData() {
    const grouped = this.groupedMetadata();
    const dbContexts = Object.keys(grouped).sort();
    const treeNodes: TreeNode[] = dbContexts.map(dbContext => {
      const entities = grouped[dbContext];
      const children: TreeNode[] = entities.map(entity => ({
        name: entity.name,
        type: 'entity' as const,
        dbContext: dbContext,
        entity: entity
        // No children property for leaf nodes
      }));
      
      const dbContextNode: TreeNode = {
        name: dbContext,
        type: 'dbcontext' as const,
        dbContext: dbContext,
        children: children
      };
      
      return dbContextNode;
    });
    this.treeData.set(treeNodes);
  }

  selectEntity(entity: EntityMetadata) {
    this.selectedEntity.set(entity);
    // Navigate to entity route
    const encodedName = encodeURIComponent(entity.name);
    this.router.navigate(['entity', encodedName], { relativeTo: this.route });
  }

  selectDbContext(dbContext: string) {
    this.selectedDbContext.set(dbContext);
    // Navigate to DB context view route
    const encodedContext = encodeURIComponent(dbContext);
    this.router.navigate(['dbcontext', encodedContext], { relativeTo: this.route });
  }

  selectTreeNode(node: TreeNode) {
    if (node.type === 'entity' && node.entity) {
      // For entities, navigate to the entity
      this.selectEntity(node.entity);
    } else if (node.type === 'dbcontext' && node.dbContext) {
      // For dbcontext nodes, navigate to dbcontext view
      this.selectDbContext(node.dbContext);
    }
  }


  updateSelectedFromRoute() {
    const childRoute = this.route.firstChild;
    if (childRoute) {
      const routeParams = childRoute.snapshot.params;
      if (routeParams['entityName']) {
        const entityName = decodeURIComponent(routeParams['entityName']);
        const entity = this.allMetadata().find(e => e.name === entityName);
        if (entity) {
          this.selectedEntity.set(entity);
        }
      } else if (routeParams['dbContext']) {
        const dbContext = decodeURIComponent(routeParams['dbContext']);
        this.selectedDbContext.set(dbContext);
      }
    }
  }

  get dbContexts(): string[] {
    return Object.keys(this.groupedMetadata()).sort();
  }

  getEntityCount(dbContext: string): number {
    return this.groupedMetadata()[dbContext]?.length || 0;
  }

  isNodeSelected(node: TreeNode): boolean {
    if (node.type === 'entity' && node.entity) {
      return this.selectedEntity()?.name === node.entity.name;
    }
    if (node.type === 'dbcontext' && node.dbContext) {
      return this.selectedDbContext() === node.dbContext;
    }
    return false;
  }

}


