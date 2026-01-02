import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, EntityMetadata } from '../../services/api.service';

@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-form.component.html',
  styleUrl: './entity-form.component.css'
})
export class EntityFormComponent implements OnInit {
  @Input() entityMetadata!: EntityMetadata;
  @Input() entity: any = null;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  formData: any = {};
  isEditMode = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.isEditMode = this.entity !== null;
    if (this.isEditMode) {
      this.formData = { ...this.entity };
    } else {
      // Initialize form with empty values
      this.entityMetadata.properties.forEach(prop => {
        if (!prop.isKey) {
          this.formData[prop.name] = this.getDefaultValue(prop);
        }
      });
    }
  }

  getDefaultValue(prop: any): any {
    if (prop.inputType === 'checkbox') return false;
    if (prop.inputType === 'number') return null;
    return '';
  }

  onSubmit() {
    const data = { ...this.formData };
    
    // Remove key property for create
    if (!this.isEditMode) {
      delete data[this.entityMetadata.keyProperty];
    }

    const observable = this.isEditMode
      ? this.apiService.updateEntity(
          this.entityMetadata.name,
          String(data[this.entityMetadata.keyProperty]),
          data
        )
      : this.apiService.createEntity(this.entityMetadata.name, data);

    observable.subscribe({
      next: () => {
        this.save.emit();
      },
      error: (error) => {
        console.error('Failed to save:', error);
        alert('Failed to save entity: ' + (error.error?.message || error.message));
      }
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}

