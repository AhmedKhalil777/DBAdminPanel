import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, EntityMetadata } from '../../services/api.service';
import { EntityFormComponent } from '../entity-form/entity-form.component';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [CommonModule, FormsModule, EntityFormComponent],
  templateUrl: './entity-table.component.html',
  styleUrl: './entity-table.component.css'
})
export class EntityTableComponent implements OnInit {
  @Input() entityMetadata!: EntityMetadata;
  
  data: any[] = [];
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  showCreateForm = false;
  editingEntity: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getAllEntities(this.entityMetadata.name).subscribe({
      next: (data) => {
        this.data = data;
        this.totalItems = data.length;
        this.currentPage = 1;
      },
      error: (error) => {
        console.error('Failed to load data:', error);
      }
    });
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.data.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
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
}

